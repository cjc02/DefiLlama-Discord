// TODO: Clean up code
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getProtocols, getProtocol } = require('../../protocols');
const { formatTVL } = require('../../utils');
const QuickChart = require('quickchart-js');
const axios = require('axios');

// Gets all chain TVLs and returns in format for discord inline fields for embeds.
function getTVLs(protocolData) {
	const chains = protocolData.chains;
	const chainTvls = protocolData['chainTvls'];

	const data = [];
	for (let i = 0; i < chains.length; i++) {
		const chain = chainTvls[chains[i]];
		data.push({ name: chains[i] + ' TVL', value: formatTVL(chain.tvl), inline: true });
	}
	return data;
}

// Thanks https://quickchart.io/documentation/send-charts-discord-bot/
async function buildTVLChart(protocolName) {

	// Calls DefiLlama API and returns labels/data/hallmarks to build a chart with.
	// Only returns the last 244 points due to QuickChart limitations.
	// TODO: Add pagination or build charts locally and return a base64 encoded string to discord.
	async function getHistoricalTVL() {
		try {
			// Will throw error if there is any spaces
			protocolName = protocolName.replaceAll(' ', '-');
			const response = await axios.get(`https://api.llama.fi/protocol/${protocolName}`);
			const tvlData = response.data['tvl'];
			const hallmarksData = response.data['hallmarks'];
			const hallmarks = [];

			// If not found
			if (response.statusCode == 400) {
				// throw error
				console.log(response.body, protocolName);
			}

			// Convert x/y data to be useable in Chart.js
			const chartData = tvlData.slice(-244).map(point => {
				return {
					label: new Date(point['date'] * 1000).toISOString().split('T')[0],
					data: point['totalLiquidityUSD'],
				};
			});

			// If hallmarks exist, convert for usage in charts
			if (hallmarksData) {
				const beginTimestamp = tvlData[0].date;

				for (let i = 0; i < hallmarksData.length; i++) {
					const curr = hallmarksData[i];
					const timestamp = curr[0];
					const description = curr[1];

					// Only add hallmarks that will be shown on the graph
					if (timestamp > beginTimestamp) {
						const obj = {
							type: 'line',
							mode: 'vertical',
							scaleID: 'x-axis-0',
							value: new Date(timestamp * 1000).toISOString().split('T')[0],
							borderColor: 'red',
							borderWidth: 4,
							label: {
								enabled: true,
								content: description,
								font: {
									size: 6,
								},
							},
						};
						hallmarks.push(obj);
					}
				}
			}

			return [chartData, hallmarks];
		}
		catch (error) {
			console.error(error);
		}
	}

	const [chartData, hallmarks] = await getHistoricalTVL(protocolName);
	const labels = chartData.map(item => item.label);
	const data = chartData.map(item => item.data);

	const chart = new QuickChart();
	chart.setConfig({
		type: 'line',
		data: {
			labels: labels,
			datasets: [{
				label: 'TVL for ' + protocolName,
				data: data,
				borderColor: 'rgba(75, 192, 192, 1)',
				fill: false,
			}],
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
			annotation: {
				annotations: [...hallmarks],
			},
		},
	});

	// Generates short url using QuickChart for usage in discord
	const url = await chart.getShortUrl();
	return url;
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName('getprotocol')
		.setDescription('Get information about a protocol, including TVL')
		.addStringOption(option =>
			option.setName('protocol')
				.setRequired(true)
				.setDescription('The protocol you want information on')
				.setAutocomplete(true))
		.addBooleanOption(option =>
			option.setName('includechart')
				.setDescription('Include a historical chart of TVL. Included by default')),

	async execute(interaction) {
		const protocolName = interaction.options.getString('protocol');
		const includeChart = interaction.options.getBoolean('includechart');
		const [protocolData, protocolParent] = getProtocol(protocolName);

		// Delay response
		await interaction.deferReply({ ephemeral: true });

		// TODO: Add checks to ensure data exists
		let embed;
		if (protocolData) {
			embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle(`${protocolData.name} (${protocolData.symbol})`)
				.setURL(protocolData.url)
				.addFields(
					{ name: 'Category', value: protocolData.category },
					{ name: 'Total Value Locked', value: formatTVL(protocolData.tvl, true) },
					...getTVLs(protocolData),
				)
				.setThumbnail(protocolData.logo);

			if (protocolParent) {embed.setDescription(protocolParent.description);}

			if (includeChart) {
				// Get chart data
				const chartUrl = await buildTVLChart(protocolName);
				console.log(chartUrl);
				embed.setImage(chartUrl);
			}
			await interaction.followUp({ embeds: [embed] });
		}
		else {
			// TODO: error
			await interaction.reply('Failed');
		}
	},
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const filtered = getProtocols().filter(protocol => protocol.toLowerCase().startsWith(focusedValue)).slice(0, 25);

		await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
	},
};