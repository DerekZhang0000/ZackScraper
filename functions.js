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
            console.log('\n', error.code, URL)
        });
};

module.exports.getCSVData = (location, headers, stock) => {
    let retVal = '';
    headers = headers.slice(0, headers.length -1);

    const HEADER_CONFIG = {
        'Symbol' : { parser: stock},
        'Industry Major' : { parser: location.split('Industry: ').pop().split(' - ')[0]},
        'Industry Minor' : { parser: location.split('Industry: ').pop().split(' - ')[1]},
        'Rank' : { parser: location.split('\n')[3].split(')')[0] + ')' },
        'Value' : { parser: location.split('Value')[0].slice(-2).slice(0, 1)},
        'Growth' : { parser: location.split('Growth')[0].slice(-2).slice(0, 1)},
        'Momentum' : { parser: location.split('Momentum')[0].slice(-2).slice(0, 1)},
        'VGM' : { parser: location.split('VGM')[0].slice(-2).slice(0, 1)},
    }
   
    headers.forEach(field => {
        retVal += ((field == 'Industry Minor' && location.split('Industry: ').pop().split(' - ').length == 1) ? "," : (HEADER_CONFIG[field].parser + ','));
    })
    return retVal;
}

// uses cheerio scraper to find Strong Buys on zacks.com
module.exports.saveStrongBuyDataToFile = async (outputFile, allInputStocks, headers, headers2, callback) => {

    let strongBuyStocks = []
    let counter = 0;
    let $;
    console.log('Stocks listed as 1-Strong Buy: ')

    headers = headers.split('\n')[0].split(',');

    allInputStocks.forEach(async stock => {
        // console.log(stock)
        URL = `https://www.zacks.com/stock/quote/${stock}/?q=${stock.toLowerCase()}` 
        const data = await this.getRawData(URL);
        const data2 = await this.getRawData(`https://www.zacks.com/stock/quote/${stock}/income-statement`);
        try{
            $ = cheerio.load(data);
            $$ = cheerio.load(data2);
        }
        catch(e){}
        const dataText = $('.rank_view').text();
        
        if(dataText.includes('1-Strong Buy'))
        {
            content = `${stock}\n`
            contentPrint = `${stock} `
            if(counter % 30 == 0 && counter != 0 )
            {
                contentPrint = `\n${stock} `
            }
            if(process.stdout.write(contentPrint))
            {
                counter++;
            }
            
            strongBuyStocks.push(stock);

            if(outputFile.slice(-3) == 'csv')
            {
                content = this.getCSVData($('.rank_view').text(), headers, stock);   
                let content2 = '';

                if(headers2)
                {
                    var netIncomes = [];
                    netCounter = 0;
                    var links = $$("a");
                    links.each(function(i, link) {
                        if(links[i].attribs.href == `/stock/chart/${stock}/fundamental/net-income-ttm`)
                        {
                            if(links[i].children[0].data != "Net Income" && netCounter != 5)
                            {
                                netCounter++;
                                netIncomes.push(links[i].children[0].data);
                            }
                                
                        }
                    });
                    if(netIncomes)
                        netIncomes.slice().reverse().forEach(element => content2 += (element + ','))
                }

                content += content2;
                content = content.slice(0, content.length -1)+'\n'
            }
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
        // console.log('Total stock symbols given:', inputLineCount);
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
                // console.log('\nTotal stock symbols with 1-Strong Buy:', outputLineCount);
            })
    }
    else
    {
        // console.log('\nTotal stock symbols with 1-Strong Buy:', strongBuyStocks.length);
    }
}

// run the program
module.exports.runProgram = async (inputFile, outputFile, headers, headers2) => {

    // console.log('Now running Money Duplication Glitch 4000.')

    if(outputFile.slice(-3) == 'txt')
    {
        fs.writeFile(outputFile, '', () => {})
    }
    else if(outputFile.slice(-3) == 'csv')
    {
        fs.writeFile(outputFile, headers + headers2, () => {})
    }
    else
    {
        throw console.log("only supports txt or csv output files")
    }

    this.inputStocks(inputFile, allInputStocks => this.saveStrongBuyDataToFile(outputFile, allInputStocks, headers, headers2, strongBuyStocks => this.outputStockData(outputFile, strongBuyStocks)) );
}