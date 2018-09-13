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


var remotesettings = class extends ExtensionAPI {
  getAPI(context) {
    Services.prefs.setCharPref("services.settings.server", SERVER_STAGE);
    Services.prefs.setCharPref("security.content.signature.root_hash", HASH_STAGE);

    const client = RemoteSettings(SETTINGS_KEY);

    return {
      experiments: {
        remotesettings: {
          async get() {
            return client.get();
          },

          async sync() {
            await RemoteSettings.pollChanges();
          },

          async reset() {
            Services.prefs.clearUserPref("services.settings.last_etag");
            Services.prefs.clearUserPref(client.lastCheckTimePref);
            const collection = await client.openCollection();
            await collection.clear();
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
        },
      },
    };
  }
};
