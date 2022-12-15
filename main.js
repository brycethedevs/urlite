"use strict";
 
var app = require("./server.js");
 
require("greenlock-express")
    .init({
        packageRoot: __dirname,
 
        // contact for security and critical bug notices
        configDir: "./greenlock.d",
        maintainerEmail: "pixelgamer1268@gmail.com",
        // whether or not to run at cloudscale
        cluster: false
    })

    .serve(app);