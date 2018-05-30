const {classes: Cc, interfaces: Ci, manager: Cm, results: Cr, utils: Cu} = Components;

Cm.QueryInterface(Ci.nsIComponentRegistrar);

Cu.import("resource://gre/modules/Services.jsm");

const URI = "chrome://remotesettings-pi/content/index.html";

let factory;


function install(data, reason) {}

function uninstall(data, reason) {}

function startup(data, reason) {
  factory = new Factory(AboutPage);
}

function shutdown(data, reason) {
  if (factory) { factory.unregister(); }
}


class AboutPage {
  static get classID() { return Components.ID('{0c6552b8-63f4-11e8-8868-f7a3867b5982}'); }
  static get classDescription() { return "Remote Settings Product Integrity"; }
  static get contractID() { return '@mozilla.org/network/protocol/about;1?what=remotesettings-pi'; }
  static get QueryInterface() { return XPCOMUtils.generateQI([Ci.nsIAboutModule]); }

  constructor() {
    Object.freeze(this);
  }

  getURIFlags(aURI) {
    return Ci.nsIAboutModule.ALLOW_SCRIPT;
  }

  newChannel(aURI, aSecurity_or_aLoadInfo) {
    const uri = Services.io.newURI(URI, null, null);
    const channel = Services.io.newChannelFromURIWithLoadInfo(uri, aSecurity_or_aLoadInfo);
    channel.originalURI = aURI;
    return channel;
  }
}


class Factory {
  constructor(component) {
    this.component = component;
    this.register();
    Object.freeze(this);
  }

  createInstance(outer, iid) {
    if (outer) {
      throw Cr.NS_ERROR_NO_AGGREGATION;
    }
    return new this.component();
  }

  register() {
    Cm.registerFactory(this.component.classID,
                       this.component.classDescription,
                       this.component.contractID,
                       this);
  }

  unregister() {
    Cm.unregisterFactory(this.component.prototype.classID, this);
  }
}
