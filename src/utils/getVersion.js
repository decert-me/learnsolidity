export function switchVersion(v, list) {
    let selectVersion;
    list.map(e => {
        if (v.indexOf(e.id) !== -1) {
            selectVersion = e.value;
        }
    })
    return selectVersion
}

export function checkVersion(v, list) {
    const regex = /([<>]=?\s*)(\d+\.\d+\.\d+)/g;
    const matches = [];
    let match;
    while ((match = regex.exec(v)) !== null) {
    matches.push({
        symbol: match[1],
        version: match[2],
    });
    }

    const versions = matches.map((match) => {
        const reg = /^(\d+\.\d+)(\.(\d+))?$/;
        const version = match.version.match(reg)[1];
        return `${match.symbol}${version}`;
    });

    let selectVersion;
    list.map(e => {
        let str = `${e.id} ${versions.join(` && ${e.id} `)}`;
        if (eval(str)) {
            selectVersion = e.value
        }
    })
    return selectVersion
}

export function getVersion(v) {
    let type = /\^/;
    let list = [
        { id: "0.4", value: "soljson-v0.4.26+commit.4563c3fc.js" },
        { id: "0.5", value: "soljson-v0.5.17+commit.d19bba13.js" },
        { id: "0.6", value: "soljson-v0.6.12+commit.27d51765.js" },
        { id: "0.7", value: "soljson-v0.7.6+commit.7338295f.js" },
        { id: "0.8", value: "soljson-v0.8.16+commit.07a7930e.js" },
    ]
    return type.test(v) ? switchVersion(v, list) : checkVersion(v, list);
}