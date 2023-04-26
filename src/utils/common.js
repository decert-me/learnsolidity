import Identicon from "identicon.js";

export function hashAvatar(address) {
    // if (!address || address.length !== 42) {
    //     return require("@/assets/images/img/nodata.png")
    // }
    // address 15+ hex chars
    var options = {
        // foreground: [r, g, b, 255],               // rgba black
        background: [255, 255, 255, 255],         // rgba white
        margin: 0,                              // 20% margin
        // size: 420,                                // 420px square
        format: 'svg'                             // use SVG instead of PNG
        };
    // create a base64 encoded SVG
    var data = new Identicon(address, options).toString();
    data = `data:image/svg+xml;base64,${data}`
    return data
}


export function nickName(address) {
    if (address) {
        return address.substring(0,5) + "..." + address.substring(38,42);
    }
}
    