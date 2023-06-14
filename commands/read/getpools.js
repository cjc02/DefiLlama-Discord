// Get pools ordered by chain, tvl and apy
// /getpools (chain) (mintvl) (maxtvl) (minapy) (maxapy)
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatTVL, parseTVL } = require('../../utils');
const QuickChart = require('quickchart-js');
const axios = require('axios');

// Sort pool data, set limit of pools returned, and range of TVLs
// Returns in-line fields for usage in Discord.js
async function getPoolFields(rawPoolsData, limit = 10, ordered = 'ascending', minTVL, maxTVL, minAPY, maxAPY) {

	if (limit > 25 || limit < 1) {
		return 'cannot return more than 25 pools or less than 1';
	}

	// If minTVL is given, remove any chains lower than minimum
	if (minTVL) {
		const minTVLNum = parseTVL(minTVL);
		rawPoolsData = rawPoolsData.filter(chain => chain.tvlUsd >= minTVLNum);
		console.log(rawPoolsData);
	}

	// If maxTVL is given, remove any chains higher than maximum
	if (maxTVL) {
		const maxTVLNum = parseTVL(maxTVL);
		rawPoolsData = rawPoolsData.filter(chain => chain.tvlUsd <= maxTVLNum);
	}

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

	// Limit amount of pools we want
	rawPoolsData = rawPoolsData.slice(0, limit);

	// Finally, format the remaining data into discord.js fields
	const fields = [];
	for (const pool of rawPoolsData) {
		const symbol = pool.symbol;
		const tvl = formatTVL(pool.tvlUsd, true);
		const apy = pool.apy;
		const field = { name: symbol, value: `TVL: ${tvl} APY: ${apy}%`, inline: true };
		fields.push(field);
	}

	// Lastly we process the data into a charturl
	const data = rawPoolsData.map(pool => pool.tvlUsd);
	const labels = rawPoolsData.map(pool => pool.symbol);

	const chart = new QuickChart();
	chart.setConfig({
		type: 'bar',
		data: {
			labels: labels,
			datasets: [{
				label: 'Pool TVLs',
				data: data,
				backgroundColor: 'rgba(54, 162, 235, 0.5)',
				borderColor: 'rgb(54, 162, 235)',
				borderWidth: 1,
			}],
		},
		options: {
			plugins: {
				// Disable the legend
				legend: { display: false },

				// Add a title
				title: {
					display: true,
					text: 'Chain TVLs',
				},
				datalabels: {
					anchor: 'end',
					align: 'top',
					color: '#fff',
					backgroundColor: 'rgba(34, 139, 34, 0.6)',
					borderColor: 'rgba(34, 139, 34, 1.0)',
					borderWidth: 1,
					borderRadius: 5,
					formatter: (value) => {
						return value.toLocaleString('en-US', { style:'currency', currency:'USD', notation: 'compact' });
					},
				},
			},
			scales: {
				y: {
					ticks: {
						callback: function(value) {
							return value.toLocaleString('en-US', { style:'currency', currency:'USD', notation: 'compact' });
						},
					},
				},
			},
		},
	});

	// Generates short url using QuickChart for usage in discord
	const chartURL = await chart.getShortUrl();
	console.log(chartURL);

	console.log(fields);
	return [fields, chartURL];
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('getpools')
		.setDescription('Gets pools by chain, tvl and apy')
		.addNumberOption(option =>
			option.setName('limit')
				.setDescription('The number of pools you want returned from 1-25')
				.setMinValue(1)
				.setMaxValue(25))
		.addStringOption(option =>
			option.setName('order')
				.setDescription('Sort APY by highest to lowest or lowest to highest')
				.addChoices({ name: 'Highest to lowest', value: 'ascending' }, { name: 'Lowest to highest', value: 'descending' }))
		.addStringOption(option =>
			option.setName('mintvl')
				.setDescription('Filter out any pools with a lower TVL than the given value'))
		.addStringOption(option =>
			option.setName('maxtvl')
				.setDescription('Filter out any pools with a higher TVL than the given value'))
		.addNumberOption(option =>
			option.setName('minapy')
				.setDescription('Filter out any pools with a lower APY than the given value'))
		.addNumberOption(option =>
			option.setName('maxapy')
				.setDescription('Filter out any pools with a higher APY than the given value'))
		.addBooleanOption(option =>
			option.setName('includechart').setDescription('Includes a pie chart visualizing the data')),
	async execute(interaction) {
		const limit = interaction.options.getNumber('limit') ?? 10;
		const order = interaction.options.getString('order') ?? 'descending';
		const mintvl = interaction.options.getString('mintvl') ?? '0';
		const maxtvl = interaction.options.getString('maxtvl') ?? '100T';
		const minapy = interaction.options.getNumber('minapy') ?? 0;
		const maxapy = interaction.options.getNumber('maxapy') ?? Infinity;
		const includeChart = interaction.options.getBoolean('includechart') ?? false;

		const response = await axios.get('https://yields.llama.fi/pools');
		const [fields, chartURL] = await getPoolFields(response.data.data, limit, order, mintvl, maxtvl, minapy, maxapy);

		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle('Pools TVL and APY')
			.addFields(
				...fields,
			);

		if (includeChart) {
			embed.setImage(chartURL);
		}
		await interaction.reply({ embeds: [embed] });
	},
};