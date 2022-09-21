const {
  withNativeFederation,
  shareAll,
} = require("@softarc/native-federation/build");

module.exports = withNativeFederation({
  name: "remote",
  exposes: {
    "./remote-app": "./src/App.svelte",
    "./remote-counter": "./src/lib/Counter.svelte"
  },
  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: "auto",
      includeSecondaries: false,
    }),
  },

});

