const { Services } = ChromeUtils.import("resource://gre/modules/Services.jsm", {});
const { RemoteSettings } = ChromeUtils.import("resource://services-settings/remote-settings.js", {});


// The remote settings collection name
const SETTINGS_KEY = "product-integrity";
// Product Integrity team modifies data on stag.
const SERVER_STAGE = "https://settings.stage.mozaws.net/v1";
// Content-signature root hash for stage.
const HASH_STAGE = "DB:74:CE:58:E4:F9:D0:9E:E0:42:36:BE:6C:C5:C4:F6:6A:E7:74:7D:C0:21:42:7A:03:BC:2F:57:0C:8B:9B:90";
// This should be taken from the server (see Bug 1465607)
const ATTACHMENTS_BASE_URL = "https://net-mozaws-stage-kinto-fennec.s3.amazonaws.com"


async function reset(client) {
  Services.prefs.clearUserPref("services.settings.last_etag");
  Services.prefs.clearUserPref(client.lastCheckTimePref);
  const collection = await client.openCollection();
  await collection.clear();
}

function show(records) {
  const list = document.getElementById("records-list");
  const tpl = document.getElementById("record-tpl");

  list.innerHTML = records.length ? "" : "Empty.";
  for (const record of records) {
    const item = tpl.content.cloneNode(true);
    item.querySelector(".title").textContent = record.title;
    const url = `${ATTACHMENTS_BASE_URL}/${record.attachment.location}`;
    item.querySelector("a").setAttribute("href", url);
    list.appendChild(item);
  }
}

async function main() {
  Services.prefs.setCharPref("services.settings.server", SERVER_STAGE);
  Services.prefs.setCharPref("security.content.signature.root_hash", HASH_STAGE);

  const client = RemoteSettings(SETTINGS_KEY);

  // On page load show current list.
  const current = await client.get();
  await show(current);

  // When sync occurs, refresh the list.
  client.on("sync", async ({ data: { current } }) => show(current));

  // Start sync on click.
  document.getElementById("sync").onclick = () => RemoteSettings.pollChanges();

  // Empty local database and displayed list on reset.
  document.getElementById("reset").onclick = async () => {
    await reset(client);
    show([]);
  };
}

window.addEventListener("DOMContentLoaded", main);
