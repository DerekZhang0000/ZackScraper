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

module.exports.getCSVData = ($, headers, stock) => {
    let retVal = '';
    let mainData = $('.rank_view').text()
    headers = headers.slice(0, headers.length -1);

    const HEADER_CONFIG = {
        'Symbol' : { parser: stock},
        'Name' : { parser: $(`a[href=/stock/quote/${stock}]`)[0].children[0].data.split(' (')[0].replace(/,/g,'')},
        'Industry Major' : { parser: mainData.split('Industry: ').pop().split(' - ')[0]},
        'Industry Minor' : { parser: mainData.split('Industry: ').pop().split(' - ')[1]},
        'Rank' : { parser: mainData.split('\n')[3].split(')')[0] + ')' },
        'Value' : { parser: mainData.split('Value')[0].slice(-2).slice(0, 1)},
        'Growth' : { parser: mainData.split('Growth')[0].slice(-2).slice(0, 1)},
        'Momentum' : { parser: mainData.split('Momentum')[0].slice(-2).slice(0, 1)},
        'VGM' : { parser: mainData.split('VGM')[0].slice(-2).slice(0, 1)},
    }
   
    headers.forEach(field => {
        retVal += ((field == 'Industry Minor' && mainData.split('Industry: ').pop().split(' - ').length == 1) ? "," : (HEADER_CONFIG[field].parser + ','));
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
                content = this.getCSVData($, headers, stock);   
                let content2 = '';

                if(headers2)
                {
                    // getting data
                    var netIncomes = [];
                    netCounter = 0;
                    var links = $$("a");
                    links.each(function(i, link) {
                        if(links[i].attribs.href == `/stock/chart/${stock}/fundamental/net-income-ttm`)
                        {
                            if(links[i].children[0].data != "Net Income" && netCounter != 5)
                            {
                                netCounter++;
                                netIncomes.push(links[i].children[0].data.replace(/,/g,''));
                            }
                                
                        }
                    });
                    if(netIncomes)
                    {
                        let reverseNetIncomes = netIncomes.slice().reverse();
                        reverseNetIncomes.forEach(element => content2 += (element + ','));

                        // iterating over data found to add to csv (additional)
                        let yearlyIncrement = [];
                        let incrementGrowthCounter = 0;

                        // Consecutive Net Income Growth cell
                        reverseNetIncomes.forEach((element, index) => {
                            let currentNum = Number(reverseNetIncomes[index]);
                            let nextNum = reverseNetIncomes[index + 1] ? Number(reverseNetIncomes[index + 1]) : 'null';

                            if(nextNum != 'null')
                            {
                                yearlyIncrement.push(currentNum <= nextNum ? true : false);
                            }
                        });
                        
                        yearlyIncrement.forEach(element => { if(element) incrementGrowthCounter++;})
                        content2 += `${incrementGrowthCounter},`;
                        yearlyIncrement = [];

                        // Average Growth cell
                        reverseNetIncomes.forEach((element, index) => {
                            let currentNum = Number(reverseNetIncomes[index]);
                            let nextNum = reverseNetIncomes[index + 1] ? Number(reverseNetIncomes[index + 1]) : 'null';

                            if(nextNum != 'null')
                            {
                                if(currentNum == 0 && nextNum == 0)
                                    yearlyIncrement.push(0); 
                                else if(currentNum == 0)
                                    yearlyIncrement.push(1);
                                else
                                    yearlyIncrement.push((nextNum / currentNum) - 1);
                            }
                        });

                        let sum = yearlyIncrement.reduce(function (previousValue, currentValue) {
                            return previousValue + currentValue;
                        });

                        content2 += (sum / yearlyIncrement.length) + ','

                    }
                        

                    
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
            // callback(strongBuyStocks);
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
        rl.on('line', (line) => {
            outputLineCount++;         
        });
    
        // when done reading input file, scrape website for each
        rl.on('close', () => {
            // console.log('\n1 Total stock symbols with 1-Strong Buy:', outputLineCount);
        })
    }
    else
    {
        // console.log('\n2 Total stock symbols with 1-Strong Buy:', strongBuyStocks.length);
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

    // this.outputStockData is for post run data if needed
    // when enabled, remove comment from saveStrongBuyDataToFile(~159)::callback()
    this.inputStocks(inputFile, allInputStocks => this.saveStrongBuyDataToFile(outputFile, allInputStocks, headers, headers2, /*strongBuyStocks => this.outputStockData(outputFile, strongBuyStocks) */) );
}