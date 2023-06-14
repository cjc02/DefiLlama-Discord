// Get pools ordered by chain, tvl and apy
// /getpools (chain) (mintvl) (maxtvl) (minapy) (maxapy)
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatTVL } = require('../../utils');
const QuickChart = require('quickchart-js');
const axios = require('axios');

// Sort pool data, set limit of pools returned, and range of TVLs
// Returns in-line fields for usage in Discord.js
async function getPoolFields(rawPoolsData, limit = 10, ordered = 'ascending', minTVL, maxTVL, minAPY, maxAPY) {

	// [ ... ] Reuse the parseTVL function from the `getchainstvl.js` script here.

	if (limit > 25 || limit < 1) {
		return 'cannot return more than 25 pools or less than 1';
	}

	// [ ... ] Handle minTVL and maxTVL the same way as in the `getchainstvl.js` script.

	// If minAPY is given, remove any pools lower than minimum
	if (minAPY) {
		rawPoolsData = rawPoolsData.filter(pool => pool.apy >= minAPY);
	}

	// If maxAPY is given, remove any pools higher than maximum
	if (maxAPY) {
		rawPoolsData = rawPoolsData.filter(pool => pool.apy <= maxAPY);
	}

	// Sort APY from lowest to highest or highest to lowest
	if (ordered == 'ascending') {
		rawPoolsData = rawPoolsData.sort((a, b) => a.apy - b.apy);
	}
	else if (ordered == 'descending') {
		rawPoolsData = rawPoolsData.sort((a, b) => b.apy - a.apy);
	}

	// [ ... ] Handle limiting and formatting fields like in the `getchainstvl.js` script.

	return [fields, chartURL];
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('getpools')
		.setDescription('Get pools by chain and tvl')
		.addStringOption(option =>
			option.setName('chain')
				.setDescription('The chain you want pools from'))
		.addStringOption(option =>
			option.setName('mintvl')
				.setDescription('Filter out any pools with a lower TVL than the given value'))
		.addStringOption(option =>
			option.setName('maxtvl')
				.setDescription('Filter out any pools with a higher TVL than the given value')),
	async execute(interaction) {
		// By default gives all pools
		const chain = interaction.options.getString('chain');
		const mintvl = interaction.options.getString('mintvl');
		const maxtvl = interaction.options.getString('maxtvl');

		const response = await axios.get('https://api.llama.fi/v2/pools');
		const fields = await getPoolFields(response.data, chain, mintvl, maxtvl);

		// TODO: Error handling in case of no pools found
		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle('Pools TVL')
			.addFields(
				...fields,
			);

		await interaction.reply({ embeds: [embed] });
	},
};
