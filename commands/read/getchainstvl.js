// TODO: Add charts
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { formatTVL, parseTVL } = require('../../utils');
const QuickChart = require('quickchart-js');
const axios = require('axios');

// Sort chain data, set limit of chains returned, ascending or descending, and range of TVLs
// Returns in-line fields for usage in Discord.js
async function getChainFields(rawChainsData, limit = 10, ordered = 'ascending', minTVL, maxTVL) {

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

	// Lastly we process the data into a charturl
	const data = rawChainsData.map(chain => chain.tvl);
	const labels = rawChainsData.map(chain => chain.name);

	const chart = new QuickChart();
	chart.setConfig({
		type: 'bar',
		data: {
			labels: labels,
			datasets: [{
				label: 'Chain TVLs',
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

	return [fields, chartURL];
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
				.setDescription('Filter out any chains with a lower TVL than the given value'),
		)
		.addStringOption(option =>
			option.setName('maxtvl')
				.setDescription('Filter out any chains with a higher TVL than the given value'))
		.addBooleanOption(option =>
			option.setName('includechart').setDescription('Includes a pie chart visualizing the data')),
	async execute(interaction) {
		// By default gives 10 chains sorted by highest to lowest from 10 trillion TVL to 0 TVL
		const limit = interaction.options.getNumber('limit') ?? 10;
		const order = interaction.options.getString('order') ?? 'descending';
		const mintvl = interaction.options.getString('mintvl') ?? '0';
		const maxtvl = interaction.options.getString('maxtvl') ?? '100T';
		const includeChart = interaction.options.getBoolean('includechart') ?? false;

		const response = await axios.get('https://api.llama.fi/v2/chains');
		const [fields, chartURL] = await getChainFields(response.data, limit, order, mintvl, maxtvl);

		// TODO: Error handling incase of no chains found
		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle('Chains TVL')
			.addFields(
				...fields,
			);

		// Add a chart to embed visualizing chain data
		if (includeChart) {
			embed.setImage(chartURL);
		}
		await interaction.reply({ embeds: [embed] });
	},
};
