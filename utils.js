// Converts to US Dollar
function formatTVL(num, compact = false) {
	const formatter = Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		notation: compact ? 'compact' : 'standard',
	});

	return formatter.format(num);
}

module.exports = {
	formatTVL,
};