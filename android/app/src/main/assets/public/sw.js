/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-5ccb27be'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "b52ea6705f5ee02d11cf95eedd42764d"
  }, {
    "url": "pwa-512x512.png",
    "revision": "b52ea6705f5ee02d11cf95eedd42764d"
  }, {
    "url": "pwa-192x192.png",
    "revision": "d880d1a7b7cb6d7f3e0299ac1246bf59"
  }, {
    "url": "index.html",
    "revision": "31f79ce20043812f1252b452864931cf"
  }, {
    "url": "icon.svg",
    "revision": "bff3308dff03d5963fa93fbbc65c6826"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "878160a1e76dfcc226c44e513fe9d9a5"
  }, {
    "url": "assets/web-CnyrO3pp.js",
    "revision": null
  }, {
    "url": "assets/web-CEuF_VKr.js",
    "revision": null
  }, {
    "url": "assets/web-BBd2zI_0.js",
    "revision": null
  }, {
    "url": "assets/web-08w3v2lS.js",
    "revision": null
  }, {
    "url": "assets/index-QRximV2W.css",
    "revision": null
  }, {
    "url": "assets/index-B5pj1JNh.js",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "878160a1e76dfcc226c44e513fe9d9a5"
  }, {
    "url": "icon.svg",
    "revision": "bff3308dff03d5963fa93fbbc65c6826"
  }, {
    "url": "pwa-192x192.png",
    "revision": "d880d1a7b7cb6d7f3e0299ac1246bf59"
  }, {
    "url": "pwa-512x512.png",
    "revision": "b52ea6705f5ee02d11cf95eedd42764d"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "b52ea6705f5ee02d11cf95eedd42764d"
  }, {
    "url": "manifest.webmanifest",
    "revision": "285f217527782679e06d5acfd2a1d2f0"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/api\.alquran\.cloud\/.*/i, new workbox.StaleWhileRevalidate({
    "cacheName": "quran-api-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 200,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 30,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
