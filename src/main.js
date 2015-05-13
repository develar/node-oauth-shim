var connect = require("connect")

var oauthConfigSerialized = process.env.OAUTH
var oauthShimConfig = oauthConfigSerialized == null ? null : JSON.parse(oauthConfigSerialized)
if (oauthShimConfig == null) {
    console.error("You must define OAUTH environment variable to specify client ID's and secret (see https://www.npmjs.com/package/oauth-shim)")
    return
}

console.log("Client IDs", Object.keys(oauthShimConfig))

var oauthShim = require("./oauth-shim")
oauthShim.init(oauthShimConfig)

var app = connect()
app.use(oauthShim)
app.listen(80)