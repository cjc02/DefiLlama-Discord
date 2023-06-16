// Get chart of a token by chain
// TODO: Autocomplete chain (also useful for other commands with chain arg)
// TODO: Add support for accepting multiple chain:contracts
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { isAddress } = require('../../utils');

/**
 * Gets token prices at regular time intervals
 *
 * @method getCoinData
 * @param {String} chain the name of the chain
 * @param {String} contractaddress the contract address, must be valid
 * @param {String} start unix timestamp of earliest data point requested
 * @param {String} end the unix timestamp where you want the chart to end at
 * @param {String} span number of data points returned, defaults to 0
 * @param {String} period duration between data points, defaults to 24 hours
 * @param {String} searchWidth time range on either side to find price data, defaults to 10% of period
 *
 * @return {JSON}
 *
 * @throws {Error} - If both 'start' and 'end' parameters are provided
*/
async function getCoinData({ chain, contractaddress, start, end, span, period, searchWidth }) {

	try {
		const params = {
			coins: `${chain}:${contractaddress}`,
			span: span,
			period: period,
			searchWidth: searchWidth,
		};

		if (start !== undefined) params.start = start;
		if (end !== undefined) params.end = end;

		const response = await axios.get(`https://coins.llama.fi/chart/${coins}`, {
			params: params,
			headers: {
				'Accept': 'application/json',
			},
		});

		return response.data;
	}
	catch (error) {
		console.error(error);
	}
}

/**
 * Calculates the number of data points that should be returned given a start time, end time, and period.
 *
 * @param {Number} start - The Unix timestamp of the earliest data point requested.
 * @param {Number} end - The Unix timestamp of the latest data point requested.
 * @param {String} period - The duration between data points (e.g. '4h' for 4 hours, '1D' for one day, '2W' for two weeks, etc).
 *
 * @returns {Number} The estimated number of data points that will be returned.
 */
function getNumberOfDataPoints(start, end, period) {
	// Convert period to seconds
	const units = period.slice(-1).toLowerCase();
	const value = parseInt(period.slice(0, -1));

	let periodInSeconds;
	switch (units) {
	case 'm':
		periodInSeconds = value * 60;
		break;
	case 'h':
		periodInSeconds = value * 60 * 60;
		break;
	case 'd':
		periodInSeconds = value * 24 * 60 * 60;
		break;
	case 'w':
		periodInSeconds = value * 7 * 24 * 60 * 60;
		break;
	default:
		console.log('Invalid period unit');
		return;
	}

	// Calculate number of data points
	const numberOfDataPoints = Math.floor((end - start) / periodInSeconds);

	return numberOfDataPoints;
}


module.exports = {
	data: new SlashCommandBuilder()
		.setName('getcoinchart')
		.setDescription('Gets chart of a token')
		.addStringOption(option =>
			option.setName('chain')
				.setDescription('The chain the contract address is located on')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('contractaddress')
				.setDescription('The contract address of the token')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('start')
				.setDescription('unix timestamp of earliest data point requested, defaults to one 4 hours ago'))
		.addIntegerOption(option =>
			option.setName('end')
				.setDescription('unix timestamp of latest data point requested, defaults to now'))
		.addIntegerOption(option =>
			option.setName('span')
				.setDescription('number of data points returned, defaults to estimated value')),
	async execute(interaction) {
		const chain = interaction.options.getString('chain').toLowerCase();
		const contractaddress = interaction.options.getString('contractaddress');
		const start = interaction.options.getNumber('contractaddress');
		const end = interaction.options.getNumber('contractaddress');
		const period = interaction.options.getString('period');
		const searchWidth = interaction.options.getNumber('searchwidth');
		const span = interaction.options.getNumber('span') ?? getNumberOfDataPoints(start, end, period);

		// Ensure valid address
		if (!isAddress(contractaddress)) {
			await interaction.reply('Invalid address');
		}

		if (start && end) {
			await interaction.reply('Use either start or end parameter, not both');
		}

		const coindata = await getCoinData({ chain: chain, contractaddress: contractaddress, start: start, end: end, span: span, searchWidth: searchWidth, period: period });
		const chartURL = await getCoinChart(coindata);
		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(`Chart ${contractaddress}`);

		embed.setImage(chartURL);
		await interaction.reply({ embeds: [embed] });
	},
};