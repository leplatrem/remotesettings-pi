/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// This should be taken from the server (see Bug 1465607)
const ATTACHMENTS_BASE_URL = "https://net-mozaws-stage-kinto-fennec.s3.amazonaws.com";

const remotesettings = browser.experiments.remotesettings;

function showError(error) {
  if (error) {
    console.error(error);
  }
  document.getElementById("error").textContent = error;
}

function show(records) {
  const list = document.getElementById("records-list");
  const tpl = document.getElementById("record-tpl");

  list.innerText = records.length ? "" : "Empty.";
  for (const record of records) {
    const item = tpl.content.cloneNode(true);
    item.querySelector(".title").textContent = record.title;
    if (record.attachment) {
      const url = `${ATTACHMENTS_BASE_URL}/${record.attachment.location}`;
      item.querySelector("a").setAttribute("href", url);
      item.querySelector("img").setAttribute("src", url);
    } else {
      item.querySelector("a").textContent = "";
    }
    list.appendChild(item);
  }
}

async function main() {
  // Load the UI in the background.
  remotesettings.get().then(records => show(records));

  // Start sync on click.
  document.getElementById("sync").onclick = () => {
    showError(null);
    remotesettings.sync();
  }

  // Empty local database and displayed list on reset.
  document.getElementById("reset").onclick = async () => {
    showError(null);
    await remotesettings.reset();
    show([]);
  };

  remotesettings.onSync.addListener(data => {
    const current = JSON.parse(data);
    show(current);
  });

  remotesettings.onError.addListener(error => showError(error));
}

window.addEventListener("DOMContentLoaded", main);
