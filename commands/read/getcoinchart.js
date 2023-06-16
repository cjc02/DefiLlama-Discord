// Get chart of a token by chain
// TODO: Autocomplete chain (also useful for other commands with chain arg)
// TODO: Add support for accepting multiple chain:contracts
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isAddress } = require('../../utils');
const axios = require('axios');
const QuickChart = require('quickchart-js');

async function getCoinChartUrl(coinData) {
	// Prepare the data for the chart
	const timestamps = coinData.prices.map(p => new Date(p.timestamp * 1000).toISOString().slice(0, 10).replace(/-/g, ''));
	const prices = coinData.prices.map(p => p.price);

	// Create the chart
	const chart = new QuickChart();
	chart.setConfig({
		type: 'line',
		data: {
			labels: timestamps,
			datasets: [{
				label: 'Price',
				data: prices,
				fill: false,
				borderColor: 'blue',
			}],
		},
		options: {
			responsive: true,
			scales: {
				x: {
					type: 'time',
					time: {
						unit: 'day',
					},
				},
				y: {
					beginAtZero: true,
				},
			},
		},
	});
	const url = chart.getShortUrl();

	return url;
}

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
 * @returns {Promise<JSON>}
 *
 * @throws {Error} - If both 'start' and 'end' parameters are provided
*/
async function getCoinData({ chain, contractaddress, start, end, span, period, searchWidth }) {

	try {
		const params = {};

		// Use default 1D for period if not given
		if (!period) {params.period = '1D';}

		// Estimate span if it's not entered
		if (!span) {
			params.span = 10;
		}

		if (searchWidth) { params.searchWidth = searchWidth;}
		else {
			params.searchWidth = 600;
		}

		if (start) params.start = start;
		if (end) params.end = end;

		// If no value is given for either start or end, we get current unix timestamp
		if (!start && !end) {
			const currentUnixTimestamp = Math.floor(new Date().getTime() / 1000);
			params.end = currentUnixTimestamp;
		}

		const coin = `${chain}:${contractaddress}`;
		const response = await axios.get(`https://coins.llama.fi/chart/${coin}`, {
			params: params,
		});

		const coinData = response.data.coins;
		const tokenData = coinData[coin];

		return tokenData;
	}
	catch (error) {
		console.error(error);
		return Promise.reject(error);
	}
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
		.addStringOption(option =>
			option.setName('start')
				.setDescription('Unix timestamp of earliest data point requested'))
		.addStringOption(option =>
			option.setName('end')
				.setDescription('Unix timestamp of latest data point requested'))
		.addStringOption(option =>
			option.setName('span')
				.setDescription('Number of data points returned, defaults to estimated value'))
		.addStringOption(option =>
			option.setName('period')
				.setDescription('Duration between data points, defaults to 24 hours'))
		.addStringOption(option =>
			option.setName('searchwidth')
				.setDescription('Time range on either side to find price data, defaults to 10% of period')),
	async execute(interaction) {
		const chain = interaction.options.getString('chain').toLowerCase();
		const contractaddress = interaction.options.getString('contractaddress');
		const start = interaction.options.getNumber('start');
		const end = interaction.options.getNumber('end');
		const period = interaction.options.getString('period');
		const searchWidth = interaction.options.getNumber('searchwidth');
		const span = interaction.options.getNumber('span');

		// Ensure valid address
		if (!isAddress(contractaddress)) {
			await interaction.reply('Invalid address');
		}

		if (start && end) {
			await interaction.reply('Use either start or end parameter, not both');
		}

		const coindata = await getCoinData({ chain: chain, contractaddress: contractaddress, start: start, end: end, span: span, searchWidth: searchWidth, period: period });
		const chartURL = await getCoinChartUrl(coindata);

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(`Chart ${contractaddress.substring(0, 6) + '...' + contractaddress.substring(contractaddress.length - 6)}`);

		embed.setImage(chartURL);
		await interaction.reply({ embeds: [embed] });
	},
};