const _ = require('lodash');
const moment = require('moment');

let dateTime = "20191212_121556"
dateTime = moment( dateTime, 'YYYYMMDD_HHmmss', true).format("YYYY-MM-DD HH:mm:ss").valueOf();
console.log(moment(dateTime).valueOf());

let person = {Index: '', Timestamp: '', HisVisits: [{Vid: 'abc', Timestamp: 0}, {Vid: 'bcd', Timestamp: 90}]};

console.log(person.HisVisits.filter(item => { return (item.Vid === 'abc') }));
    

const getVideoFilmedDate = (videoName) => {

    let dateTime = videoName.slice(0, -3).replace(/[^0-9]/ig,"").slice(0,14);
    console.log(dateTime);
    dateTime = moment( dateTime, 'YYYYMMDDHHmmss', true).format("YYYY-MM-DD HH:mm:ss");
    console.log(moment(dateTime).valueOf());
}

getVideoFilmedDate('sfdsd2014kllk1202[][]101203.mp4');

let date1 = moment(`20200101`);
let date2 = moment(`20200110`);
console.log('test', 'VID_20200106_185815'.slice(4, 12))

let curVisitDate = moment('VID_20200106_185815'.slice(4, 12));
let firstHisVisitDate = moment('VID_20200110_185815'.slice(4, 12));

console.log(curVisitDate.diff(firstHisVisitDate, 'days'));