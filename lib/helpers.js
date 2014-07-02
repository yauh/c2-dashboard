timeToSeconds = function (time) {
    if (!time) {
        return;
    }
    var p = time.split(':'),
        s = 0, m = 1;
    while (p.length > 0) {
        s += m * parseInt(p.pop(), 10);
        m *= 60;
    }
    return s;
}

createTimestamp = function (date, time) {
    var timestamp = moment(date + ' ' + time, "DD.MM.YY HH:mm Z");
    return timestamp.toISOString();
}

csvToJson = function (csv) {
    var parseConfig = {
        delimiter: ";",
        header: false
    };
    var json = $.parse(csv, parseConfig);
    return json;
}

calculateCalories = function (duration, calH) {
    var calories = Math.round((calH/3600) * duration);
    return calories;
}