const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Fetch all Futures symbols from Bybit
 */
async function getBybitFuturesSymbols() {
    try {
        console.log('Fetching Futures symbols from Bybit...');
        
        // Bybit API endpoint for instrument info (Futures)
        const apiUrl = 'https://api.bybit.com/v5/market/instruments-info';
        
        const response = await axios.get(apiUrl, {
            params: {
                category: 'linear' // 'linear' is for USDT perpetual futures
            }
        });
        
        if (response.data.retCode !== 0) {
            throw new Error(`API Error: ${response.data.retMsg}`);
        }
        
        // Extract symbols from the response
        const instruments = response.data.result.list;
        const symbols = instruments
            .filter(instrument => {
                // Only active trading symbols
                if (instrument.status !== 'Trading') return false;
                
                // Only perpetual contracts (no expiry date)
                // Perpetual contracts don't have contractType or have contractType as 'LinearPerpetual'
                // Also filter out symbols with date patterns (like BTCUSDT-07NOV25)
                const symbol = instrument.symbol;
                const hasDatePattern = /-\d{2}[A-Z]{3}\d{2}$/.test(symbol); // Pattern like -07NOV25
                
                return !hasDatePattern && (
                    !instrument.contractType || 
                    instrument.contractType === 'LinearPerpetual' ||
                    instrument.contractType === 'InversePerpetual'
                );
            })
            .map(instrument => instrument.symbol)
            .sort(); // Sort alphabetically
        
        console.log(`Found ${symbols.length} Futures symbols`);
        
        return symbols;
        
    } catch (error) {
        console.error('Error fetching symbols from Bybit:', error.message);
        throw error;
    }
}

/**
 * Create directory if it doesn't exist
 */
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    }
}

/**
 * Save symbols to text file
 */
function saveSymbolsToFile(symbols, filePath) {
    try {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        ensureDirectoryExists(dir);
        
        // Format symbols as required (one symbol per line)
        const content = symbols.join('\n');
        
        // Write to file
        fs.writeFileSync(filePath, content, 'utf8');
        
        console.log(`Successfully saved ${symbols.length} symbols to: ${filePath}`);
        console.log('First 5 symbols:');
        symbols.slice(0, 5).forEach(symbol => console.log(`  ${symbol}`));
        if (symbols.length > 5) {
            console.log('  ...');
        }
        
    } catch (error) {
        console.error('Error saving symbols to file:', error.message);
        throw error;
    }
}

/**
 * Main function
 */
async function main() {
    try {
        console.log('=== Bybit Futures Symbol Fetcher ===\n');
        
        // Fetch symbols from Bybit
        const symbols = await getBybitFuturesSymbols();
        
        // Define output file path
        const outputPath = path.join(__dirname, 'export', 'Bybit', 'symbols_futures_bybit.txt');
        
        // Save to file
        saveSymbolsToFile(symbols, outputPath);
        
        console.log('\n=== Task completed successfully! ===');
        
    } catch (error) {
        console.error('\n=== Error occurred ===');
        console.error(error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    getBybitFuturesSymbols,
    saveSymbolsToFile
};