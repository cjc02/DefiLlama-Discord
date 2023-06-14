// TODO: Clean up code
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatTVL } = require('../../utils');
const { getPool, getPools, getPoolIDBySymbol } = require('../../protocols');
const QuickChart = require('quickchart-js');
const axios = require('axios');

// Gets all historical TVLs and returns in format for discord inline fields for embeds.
async function getHistoricalData(poolID) {
	try {
		const response = await axios.get(`https://yields.llama.fi/chart/${poolID}`);
		return response.data.data;
	}
	catch (error) {
		console.error(`Error fetching historical data: ${error}`);
	}
}

// Builds chart of TVL & APY based on historical data
async function buildTVLAPYChart(rawHistoricalData) {
	const labels = rawHistoricalData.map(item => item.timestamp.split('T')[0]);
	const tvlData = rawHistoricalData.map(item => item.tvlUsd);
	const apyData = rawHistoricalData.map(item => item.apy);

	const chart = new QuickChart();
	chart.setConfig({
		type: 'line',
		data: {
			labels: labels,
			datasets: [
				{
					label: 'TVL in USD',
					data: tvlData,
					borderColor: 'rgba(75, 192, 192, 1)',
					fill: false,
				},
				{
					label: 'APY',
					data: apyData,
					borderColor: 'rgba(255, 99, 132, 1)',
					fill: false,
				},
			],
		},
		options: {
			scales: {
				x: {
					type: 'time',
					time: {
						unit: 'day',
					},
				},
				yAxes: [{
					ticks: {
						callback: (val) => {
							return '$' + val.toLocaleString({ style:'currency', currency:'USD', notation: 'compact' });
						},
					},
				}],
			},
		},
	});

	const url = await chart.getShortUrl();
	return url;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('getpool')
		.setDescription('Get historical APY and TVL of a pool')
		.addStringOption(option =>
			option.setName('pool')
				.setRequired(true)
				.setDescription('The pool symbol you want APY/TVL on')
				.setAutocomplete(true))
		.addBooleanOption(option =>
			option.setName('includechart')
				.setDescription('Include a historical chart of TVL and APY')),

	async execute(interaction) {
		const poolSymbol = interaction.options.getString('pool');
		const includeChart = interaction.options.getBoolean('includechart');

		// Pool data
		const poolID = getPoolIDBySymbol(poolSymbol);
		const poolData = getPool(poolID);

		let embed;
		if (poolData) {
			embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle(`${poolData.symbol} (${poolData.project})`)
				.addFields(
					{ name: 'Chain', value: poolData.chain },
					{ name: 'Total Value Locked', value: formatTVL(poolData.tvlUsd, true) },
					{ name: 'Annual Percentage Yield', value: `${poolData.apy}` },
				);

			if (poolData.apyPct1D !== 0 && poolData.apyPct7D !== 0 && poolData.apyPct30D !== 0) {
				embed.addFields(
					{ name: 'APY % 1D', value: `${poolData.apyPct1D}`, inline: true },
					{ name: 'APY % 7D', value: `${poolData.apyPct7D}`, inline: true },
					{ name: 'APY % 30D', value: `${poolData.apyPct30D}`, inline: true },
				);
			}

			if (includeChart) {
				const historicalData = await getHistoricalData(poolID);
				const chartUrl = await buildTVLAPYChart(historicalData);
				console.log(chartUrl);
				embed.setImage(chartUrl);
			}
			await interaction.reply({ embeds: [embed] });
		}
		else {
			// TODO: error
			await interaction.reply('Failed');
		}
	},
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const filtered = Object.keys(getPools())
			.filter(poolKey => {
			// Only include keys that are not pool IDs
				const isPoolId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(poolKey);
				return !isPoolId && poolKey.toLowerCase().startsWith(focusedValue);
			})
			.slice(0, 25);
		await interaction.respond(filtered.map(poolKey => ({ name: poolKey, value: poolKey })));
	},
};