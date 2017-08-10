"use strict";

const OversizedElementBin = require("./oversized_element_bin");
const MaxRectsBin = require("./max_rects_bin");
const EDGE_MAX_VALUE = 4096;

module.exports = class MaxRectPacker {
    constructor(width, height, padding) {
        this.maxWidth = width || EDGE_MAX_VALUE;
        this.maxHeight = height || EDGE_MAX_VALUE;
        this.padding = padding || 0;
        this.bins = [];
    }

    add(width, height, data) {
        if (width > this.maxWidth || height > this.maxHeight) {
            this.bins.push(new OversizedElementBin(width, height, data));
        } else {
            let added = this.bins.find(bin => bin.add(width, height, data));
            if (!added) {
                let bin = new MaxRectsBin(this.maxWidth, this.maxHeight, this.padding);
                bin.add(width, height, data);
                this.bins.push(bin);
            }
        }
    }

    sort(rects) {
        return rects.slice().sort((a, b) => Math.max(b.width, b.height) - Math.max(a.width, a.height));
    }

    addArray(rects) {
        this.sort(rects).forEach(rect => this.add(rect.width, rect.height, rect.data));
    }
}
