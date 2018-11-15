ChromeUtils.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyModuleGetters(this, {
  Services: "resource://gre/modules/Services.jsm",
  RemoteSettings: "resource://services-settings/remote-settings.js",
});

const { EventManager } = ExtensionCommon;
const { ExtensionError } = ExtensionUtils;

// The remote settings collection name
const SETTINGS_KEY = "product-integrity";
// Product Integrity team modifies data on stag.
const SERVER_STAGE = "https://settings.stage.mozaws.net/v1";
// Content-signature root hash for stage.
const HASH_STAGE = "DB:74:CE:58:E4:F9:D0:9E:E0:42:36:BE:6C:C5:C4:F6:6A:E7:74:7D:C0:21:42:7A:03:BC:2F:57:0C:8B:9B:90";
// Megaphone stage instance
const MEGAPHONE_STAGE = "wss://autopush.stage.mozaws.net";


function reportError(error) {
  console.log(error);
  // eg. polling error, network error etc.
  Services.obs.notifyObservers(
    null,
    "remotesettings-error",
    error.toString(),
  );
}

var remotesettings = class extends ExtensionAPI {
  getAPI(context) {
    Services.prefs.setCharPref("services.settings.server", SERVER_STAGE);
    Services.prefs.setCharPref("security.content.signature.root_hash", HASH_STAGE);
    Services.prefs.setCharPref("dom.push.serverURL", MEGAPHONE_STAGE);
    // FIXME: this is part of the gradual rollout plan for
    // megaphone. Eventually this won't be necessary.
    Services.prefs.setBoolPref("dom.push.alwaysConnect", true);

    const client = RemoteSettings(SETTINGS_KEY);

    return {
      experiments: {
        remotesettings: {
          async get() {
            try {
              return await client.get();
            } catch (e) {
              reportError(e);
            }
          },

          async sync() {
            try {
              await RemoteSettings.pollChanges();
            } catch (e) {
              reportError(e);
            }
          },

          async reset() {
            Services.prefs.clearUserPref("services.settings.last_etag");
            Services.prefs.clearUserPref(client.lastCheckTimePref);
            try {
              const collection = await client.openCollection();
              await collection.clear();
            } catch (e) {
              reportError(e);
            }
          },

          onSync: new EventManager({
            context,
            name: "remotesettings.onSync",
            register: fire => {
              const observer = async (subject, topic, data) => {
                const current = await client.get();
                fire.async(JSON.stringify(current));
              };
              Services.obs.addObserver(
                observer,
                "remote-settings-changes-polled",
              );
              return () => {
                Services.obs.removeObserver(
                  observer,
                  "remote-settings-changes-polled",
                );
              };
            },
          }).api(),

          onError: new EventManager({
            context,
            name: "remotesettings.onError",
            register: fire => {
              const observer = (subject, topic, data) => {
                fire.async(data);
              };
              Services.obs.addObserver(observer, "remotesettings-error");
              return () =>
                Services.obs.removeObserver(
                  observer,
                  "remotesettings-error",
                );
            },
          }).api(),
        },
      },
    };
  }
};
