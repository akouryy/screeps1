module.exports = {
  myBrightness(color) {
    {
      const m = /^#([0-9a-fA-F]{3})$/.exec(color);
      if(m) {
        const rgb = parseInt(m[1], 16);
        return ((rgb & 15) + ((rgb >> 4) & 15) + ((rgb >> 8) & 15)) / 15 / 3;
      }
    }
    {
      const m = /^#([0-9a-fA-F]{6})$/.exec(color);
      if(m) {
        const rgb = parseInt(m[1], 16);
        return ((rgb & 255) + ((rgb >> 8) & 255) + ((rgb >> 16) & 255)) / 255 / 3;
      }
    }
    return 1;
  },
};
