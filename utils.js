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

module.exports = {
	formatTVL,
	parseTVL,
};