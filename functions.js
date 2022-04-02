const cheerio = require("cheerio");
const fs = require("fs");
const fetch = require("node-fetch");
var readline = require('readline');
var stream = require('stream');

// gets the raw data for a given website
module.exports.getRawData = (URL) => {

    return fetch(URL)
        .then((response) => response.text())
        .then((data) => {
            return data;
        })
        .catch(error => {
            //console.log('\n', error.code, URL)
        });
};

// uses cheerio scraper to find Strong Buys on zacks.com
module.exports.saveStrongBuyDataToFile = async (outputFile, allInputStocks, callback) => {

    let strongBuyStocks = []
    let counter = 0;
    let $;
    console.log('Stocks listed as 1-Strong Buy: ')

    allInputStocks.forEach(async stock => {
        URL = `https://www.zacks.com/stock/quote/${stock}/?q=${stock.toLowerCase()}` 
        const data = await this.getRawData(URL);
        try{
            $ = cheerio.load(data);
        }
        catch(e){}
        const dataText = $('.rank_view').text();
        
        if(dataText.includes('1-Strong Buy'))
        {
            content = `${stock}\n`;
            contentPrint = `${stock} `
            if(counter % 30 == 0 && counter != 0 )
            {
                contentPrint = `\n${stock} `
            }
            if(process.stdout.write(contentPrint))
            {
                counter++;
            }
            
            strongBuyStocks.push(stock)
            fs.appendFile(outputFile, content, err => {
                if (err) {
                  console.error(err);
                  return;
                }
              })
        }
        if(allInputStocks.indexOf(stock) == allInputStocks.length - 1)
        {
            callback(strongBuyStocks);
        }
    })
}

// input stocks
module.exports.inputStocks = async (inputFile, callback) => {

    var instream = fs.createReadStream(inputFile);
    var outstream = new stream();
    var rl = readline.createInterface(instream, outstream);

    var stocks = [];
    var inputLineCount = 0;

    // read each line of the input file
    rl.on('line', line => {
        inputLineCount++;
        stocks.push(line.split('\n')[0]);
    });

    // when done reading input file, scrape website for each
    rl.on('close', () => {
        console.log('Total stock symbols given:', inputLineCount);
        callback(stocks);
    })
}

// after stocks have been outputed, get count
module.exports.outputStockData = async (outputFile, strongBuyStocks) => {

    let useOutputFileForData = false;

    if(useOutputFileForData)
    {
        var instream = fs.createReadStream(outputFile);
        var outstream = new stream();
        var rl = readline.createInterface(instream, outstream);
    
        var outputLineCount = 0;
    
            // read each line of the input file
            rl.on('line', () => {
                outputLineCount++;
            });
        
            // when done reading input file, scrape website for each
            rl.on('close', () => {
                console.log('\nTotal stock symbols with 1-Strong Buy:', outputLineCount);
            })
    }
    else
    {
        console.log('\nTotal stock symbols with 1-Strong Buy:', strongBuyStocks.length);
    }
}

// run the program
module.exports.runProgram = async (inputFile, outputFile) => {

    console.log('Now running Money Duplication Glitch 4000.')

    // erase all old data
    fs.writeFile(outputFile, '', () => {})

    this.inputStocks(inputFile, allInputStocks => this.saveStrongBuyDataToFile(outputFile, allInputStocks, strongBuyStocks => this.outputStockData(outputFile, strongBuyStocks)) );
}