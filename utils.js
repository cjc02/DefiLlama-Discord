// Converts to US Dollar
function formatTVL(num, compact = false) {
	const formatter = Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		notation: compact ? 'compact' : 'standard',
	});

	return formatter.format(num);
}

// Understands values like "1K", "1M", "1B"
function parseTVL(str) {
	const scale = str.slice(-1).toUpperCase();
	const num = parseFloat(str);
	switch (scale) {
	case 'K':
		return num * 1e3;
	case 'M':
		return num * 1e6;
	case 'B':
		return num * 1e9;
	case 'T':
		return num * 1e12;
	default:
		return num;
	}
}

// thanks https://github.com/ethereum/go-ethereum/blob/aa9fff3e68b1def0a9a22009c233150bf9ba481f/jsre/ethereum_js.go
/**
 * Checks if the given string is an address
 *
 * @method isAddress
 * @param {String} address the given HEX adress
 * @return {Boolean}
*/
const isAddress = function(address) {
	if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
		// check if it has the basic requirements of an address
		return false;
	}
	else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
		// If it's all small caps or all all caps, return true
		return true;
	}
	else {
		// Otherwise check each case
		return isChecksumAddress(address);
	}
};

/**
 * Checks if the given string is a checksummed address
 *
 * @method isChecksumAddress
 * @param {String} address the given HEX adress
 * @return {Boolean}
*/
const isChecksumAddress = function(address) {
	// Check each case
	address = address.replace('0x', '');
	const addressHash = sha3(address.toLowerCase());
	for (let i = 0; i < 40; i++) {
		// the nth letter should be uppercase if the nth digit of casemap is 1
		if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
			return false;
		}
	}
	return true;
};

module.exports = {
	isAddress,
	formatTVL,
	parseTVL,
};