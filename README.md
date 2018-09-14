# Remote Settings Product Integrity

This addon shows the content of the ``product-integrity`` remote settings collection.

# Features

- Clear local state of the collection
- Force synchronization
- Display records with image attachments as thumbnails

# Install

- Open ``about:debugging``
- Load temporary addon and pick the .zip file from the [releases page](https://github.com/mozilla/remote-settings-devtools/releases)

> Note: it is highly recommended to use a temporary or development user profile

# Development

```
npm install
```

Run in a browser with live-reload:

```
web-ext run --firefox-binary ~/path/to/firefox -s ./extension/
```
