/* eslint-disable valid-jsdoc */

const esprima = require("esprima");

/**
 * Determines whether a given node is a potential object expression that stores hashes.
 * @param {import('estree').Node} node The node.
 * @returns {boolean} Whether the given node is a potential object expression that stores hashes.
 */
function isPotentialHashNode(node) {
	return node.type === "ObjectExpression" && node.properties.length > 10;
}

/**
 * Determines whether a given node is a `".js"` literal.
 * @param {import('estree').Node} node The node.
 * @returns {boolean} Whether the given node is a  `".js"` literal.
 */
function isJsLiteral(node) {
	return node.type === "Literal" && node.value === ".js";
}

/**
 * Converts an object expression node to an object.
 * @param {import('estree').Node} node The object expression node.
 * @returns {Object} The converted object.
 */
function convertObjectExpressionToObject(node) {
	if (node.type !== "ObjectExpression") {
		throw new TypeError("`node` parameter must be an object expression node");
	}

	const object = {};
	for (const property of node.properties) {
		object[property.key.name || property.key.value] = property.value.value;
	}
	return object;
}

/**
 * Parses a program and returns potential objects that store hashes.
 * @param {string} program The program to parse in order to find object expression nodes.
 * @param {boolean} beforeJs Whether to only include the first object expression node preceeding a `".js"` literal, if present.
 */
function getHashObjects(program, beforeJs = false) {
	/**
	 * @type {import('estree').Node[]}
	 */
	const nodes = [];
	esprima.parseScript(program, {}, node => {
		nodes.push(node);
	});

	const objects = [];
	for (const node of nodes) {
		if (isPotentialHashNode(node)) {
			objects.push(convertObjectExpressionToObject(node));
		} else if (beforeJs && isJsLiteral(node) && objects.length > 0) {
			return [
				objects[objects.length - 1],
			];
		}
	}
	return objects;
}
module.exports = getHashObjects;
