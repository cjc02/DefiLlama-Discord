const fs = require('fs');
const axios = require('axios');

const filename = './data.json';
let protocols = [];
let pools = {};

function getProtocols() {
	return protocols;
}

function getPools() {
	return pools;
}

function getProtocol(protocolName) {
	try {
		const data = fs.readFileSync(filename, 'utf8');
		const protocolJSON = JSON.parse(data);
		let protocolData, protocolParent;

		for (const protocol of protocolJSON.protocols) {
			if (protocol.name === protocolName) {
				protocolData = protocol;
				// If there is a protocol parent that exists, we want to return it.
				if (protocolData.parentProtocol) {
					for (const parentProtocol of protocolJSON.protocols.parentProtocols) {
						if (parentProtocol.id === protocolData.parentProtocol) {
							protocolParent = parentProtocol;
						}
					}
					return [protocolData, protocolParent];
				}
				else {
					return [protocolData];
				}
			}
		}

		return [protocolData, protocolParent];
	}
	catch (err) {
		console.error(`Error reading file from disk: ${err}`);
	}
}

function getPool(poolId) {
	try {
		// Check if the pool data is available in the pool map
		if (pools[poolId]) {
			return pools[poolId];
		}

		return null;
	}
	catch (err) {
		console.error(`Error retrieving pool: ${err}`);
	}
}

function getPoolIDBySymbol(key) {
	const pool = pools[key];
	return pool ? pool.pool : null;
}

function updateKeys() {
	const JSONData = JSON.parse(fs.readFileSync(filename, 'utf8'));
	protocols = JSONData.protocols.protocols.map(protocol => protocol.name);
	pools = {};
	JSONData.pools.data.forEach(pool => {
		const key = `${pool.symbol} (${pool.project})`;
		pools[key] = pool;
		pools[pool.pool] = pool;
	});
}

// Gets protocols & pools data to be used for autocomplete
async function syncData() {
	try {
		const [protocolsResponse, poolsResponse] = await Promise.all([
			axios.get('https://api.llama.fi/lite/protocols2'),
			axios.get('https://yields.llama.fi/pools'),
		]);

		fs.writeFileSync(filename, JSON.stringify({
			protocols: protocolsResponse.data,
			pools: poolsResponse.data,
		}));

		updateKeys();
		console.log('protocols:', protocols);
		console.log('pools:', pools);
	}
	catch (error) {
		console.error(error);
		return false;
	}
	return true;
}

module.exports = {
	syncData,
	updateKeys,
	getProtocol,
	getPool,
	getProtocols,
	getPools,
	getPoolIDBySymbol,
};