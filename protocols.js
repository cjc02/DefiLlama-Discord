const fs = require('fs');
const axios = require('axios');

let protocols = [];
let pools = [];

function getProtocols() {
	return protocols;
}

function getPools() {
	return pools;
}

function getProtocol(protocolName) {
	try {
		const data = fs.readFileSync('./protocols.json', 'utf8');
		const protocolJSON = JSON.parse(data);
		let protocolData, protocolParent;

		for (const protocol of protocolJSON.protocols) {
			if (protocol.name === protocolName) {
				protocolData = protocol;
				// If there is a protocol parent that exists, we want to return it.
				if (protocolData.parentProtocol) {
					for (const parentProtocol of protocolJSON.parentProtocols) {
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
		const data = fs.readFileSync('./data.json', 'utf8');
		const JSONData = JSON.parse(data);
		let poolData;

		for (const pool of JSONData.pools) {
			if (pool.id === poolId) {
				poolData = pool;
				return poolData;
			}
		}

		return poolData;
	}
	catch (err) {
		console.error(`Error reading file from disk: ${err}`);
	}
}

function updateKeys() {
	const JSONData = JSON.parse(fs.readFileSync('./data.json', 'utf8'));
	protocols = JSONData.protocols.map(protocol => protocol.name);
	pools = JSONData.pools.map(pool => pool.id);
}

async function syncData() {
	try {
		const protocolsResponse = await axios.get('https://api.llama.fi/lite/protocols2');
		const poolsResponse = await axios.get('https://yields.llama.fi/pools');

		fs.writeFileSync('./data.json', JSON.stringify({
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
	updateKeys,
	getProtocol,
	getPool,
	syncData,
	getProtocols,
	getPools,
};
