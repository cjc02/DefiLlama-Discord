const { SlashCommandBuilder } = require('discord.js');
const { formatTVL } = require('../../utils');

// Sort chain data, set limit of chains returned, ascending or descending, and range of TVLs
// Returns in-line fields for usage in Discord.js
function getChainsData(rawChainsData, limit = 10, ordered = 'ascending', minTVL, maxTVL) {

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
		default:
			return num;
		}
	}

	if (limit > 25 || limit < 1) {
		return 'cannot return more than 25 chains or less than 1';
	}

	// If minTVL is given, remove any chains lower than minimum
	if (minTVL) {
		const minTVLNum = parseTVL(minTVL);
		rawChainsData = rawChainsData.filter(chain => chain.tvl >= minTVLNum);
	}

	// If maxTVL is given, remove any chains higher than maximum
	if (maxTVL) {
		const maxTVLNum = parseTVL(maxTVL);
		rawChainsData = rawChainsData.filter(chain => chain.tvl <= maxTVLNum);
	}

	// Sort TVL from lowest to highest or highest to lowest
	if (ordered == 'ascending') {
		rawChainsData = rawChainsData.sort((a, b) => a.tvl - b.tvl);
	}
	else if (ordered == 'descending') {
		rawChainsData = rawChainsData.sort((a, b) => b.tvl - a.tvl);
	}

	// Limit amount of chains we want
	rawChainsData = rawChainsData.slice(0, limit);

	// Finally, format the remaining data into discord.js fields
	const fields = [];
	for (const chain of rawChainsData) {
		const name = chain.name;
		const tvl = chain.tvl;
		const field = { name: name, value: formatTVL(tvl, true), inline: true };
		fields.push(field);
	}

	return fields;
}


module.exports = {
	data: new SlashCommandBuilder()
		.setName('getchainstvl')
		.setDescription('Gets chains by tvl')
		.addNumberOption(option =>
			option.setName('limit')
				.setDescription('The number of chains you want returned from 1-25')
				.setMinValue(1)
				.setMaxValue(25))
		.addStringOption(option =>
			option.setName('order')
				.setDescription('Sort TVL by highest to lowest or lowest to highest')
				.addChoices({ name: 'Highest to lowest', value: 'ascending' }, { name: 'Lowest to highest', value: 'descending' }))
		.addStringOption(option =>
			option.setName('mintvl')
				.setDescription('Filter out any chains with lower TVL')),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};
