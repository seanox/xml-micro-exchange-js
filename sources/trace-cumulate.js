client.global.set("trace", function(response) {

    function checksum(text) {
        var sum = 0x12345678
        for (var index = 0; index < text.length; index++)
            sum += text.charCodeAt(index) *(index +1)
        return (sum & 0xFFFFFFFF).toString(36).toUpperCase()
    }

    var hash = []
    hash.push("A:" + response.status)
    if (response.headers.valueOf("Connection-Unique") !== null)
        hash.push("B:" + "X")
    if (response.headers.valueOf("Storage") !== null)
        hash.push("C:" + checksum(response.headers.valueOf("Storage")))
    if (response.headers.valueOf("Storage-Revision") !== null)
        hash.push("D:" + response.headers.valueOf("Storage-Revision"))
    if (response.headers.valueOf("Storage-Space") !== null)
        hash.push("E:" + response.headers.valueOf("Storage-Space").replace(/\s+\w+$/, ""))
    if (response.headers.valueOf("Storage-Effects") !== null) {
        var x = response.headers.valueOf("Storage-Effects").split(/\s+/)
        var a = x.filter(function(effect) {return effect.match(/:A$/i)})
        var m = x.filter(function(effect) {return effect.match(/:M$/i)})
        var d = x.filter(function(effect) {return effect.match(/:D$/i)})
        var n = x.filter(function(effect) {return !effect.match(/:[AMD]$/i)})
        hash.push("F:" + "A:" + a.length + "/M" + m.length + "/D:" + d.length + "/N:" + n.length)
    }
    if (response.headers.valueOf("Error") !== null)
        hash.push("G:" + "X")
    if (response.headers.valueOf("Message") !== null)
        hash.push("H:" + checksum(response.headers.valueOf("Message")))
    if (response.headers.valueOf("Content-Length") !== null)
        hash.push("I:" + response.headers.valueOf("Content-Length"))
    if (response.headers.valueOf("Content-Type") !== null)
        hash.push("J:" + response.headers.valueOf("Content-Type"))
    return hash.join(" ")
})
