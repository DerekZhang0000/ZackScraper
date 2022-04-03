const functions = require('./functions.js')

/*
* Input files
* -----------
* - stocksInput.txt
* - sampleStocksInput.txt
* - smallStocksInput.txt
*/

const INPUTFILE = 'stocksInput.txt';
const OUTPUTFILE = 'stocksOutput.csv';

// If INPUTFILE is a .txt, only Symbol should be true
const HEADER_CONFIG = [
    {type : 'Symbol', bool : true},
    {type : 'Industry Major', bool : true},
    {type : 'Industry Minor', bool : true},
    {type : 'Rank', bool : true},
    {type : 'Value', bool : true},
    {type : 'Growth', bool : true},
    {type : 'Momentum', bool : true},
    {type : 'VGM', bool : true},
]
const HEADER_CONFIG2 = [
    {type : 'Net Income 4 Years Ago', bool : true},
    {type : 'Net Income 3 Years Ago', bool : true},
    {type : 'Net Income 2 Years Ago', bool : true},
    {type : 'Net Income 1 Years Ago', bool : true},
    {type : 'Net Income Most Recent', bool : true}
]

let HEADERS = '';
let HEADERS2 = '';

HEADER_CONFIG.forEach(element => {
    if(element.bool)
        HEADERS += `${element.type},`
})
HEADER_CONFIG2.forEach(element => {
    if(element.bool)
        HEADERS2 += `${element.type},`
})

let header;
if(HEADERS2)
{
    header = `${HEADERS}`;
}
else
{
    header = `${HEADERS.slice(0, HEADERS.length -1)}`;
}

let header2 = `${HEADERS2.slice(0, HEADERS2.length -1)}\n`;

console.log(header)
console.log(header2)
functions.runProgram(INPUTFILE, OUTPUTFILE, header, header2);
