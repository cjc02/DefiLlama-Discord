const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getProtocols, getProtocol } = require('../../protocols');

function formatTVL(num) {
	const formatter = Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		notation: 'compact',
		maximumFractionDigits: 0,
	});

	return formatter.format(num);
}

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

module.exports = {
	data: new SlashCommandBuilder()
		.setName('getprotocol')
		.setDescription('Get information about a protocol, including TVL')
		.addStringOption(option =>
			option.setName('protocol')
				.setRequired(true)
				.setDescription('The protocol you want information on')
				.setAutocomplete(true)),
	async execute(interaction) {
		const protocolName = interaction.options.getString('protocol');
		const [protocolData, protocolParent] = getProtocol(protocolName);

		// TODO: Add checks to ensure data exists
		let embed;
		if (protocolData) {
			embed = new EmbedBuilder()
				.setColor(0x0099FF)
				.setTitle(`${protocolData.name} (${protocolData.symbol})`)
				.setURL(protocolData.url)
				.addFields(
					{ name: 'Category', value: protocolData.category },
					{ name: 'Total Value Locked', value: formatTVL(protocolData.tvl) },
					...getTVLs(protocolData),
				)
				.setThumbnail(protocolData.logo);
			if (protocolParent) {

				embed.setDescription(protocolParent.description);
			}
			await interaction.reply({ embeds: [embed] });
		}
		else {
			// TODO: error
			await interaction.reply('Failed');
		}

		// {
		// 	category: 'CDP',
		// 	chains: [ 'Ethereum' ],
		// 	oracles: [ 'Chronicle' ],
		// 	mcap: 535965555.2277959,
		// 	name: 'MakerDAO',
		// 	symbol: 'MKR',
		// 	logo: 'https://icons.llama.fi/makerdao.jpg',
		// 	url: 'https://makerdao.com/',
		// 	referralUrl: 'https://oasis.app/?ref=0x08a3c2A819E3de7ACa384c798269B3Ce1CD0e437',
		// 	tvl: 5815740796.098475,
		// 	tvlPrevDay: 5815178719.530809,
		// 	tvlPrevWeek: 6363877155.606131,
		// 	tvlPrevMonth: 6964847973.425394,
		// 	chainTvls: {
		// 	  Ethereum: {
		// 		tvl: 5815740796.098475,
		// 		tvlPrevDay: 5815178719.530809,
		// 		tvlPrevWeek: 6363877155.606131,
		// 		tvlPrevMonth: 6964847973.425394
		// 	  }
		// 	},
		// 	defillamaId: '118'
		//   }
		// TODO: Get protocol data and parse it
	},
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused().toLowerCase();
		const filtered = getProtocols().filter(protocol => protocol.toLowerCase().startsWith(focusedValue)).slice(0, 25);

		await interaction.respond(filtered.map(choice => ({ name: choice, value: choice })));
	},
};
