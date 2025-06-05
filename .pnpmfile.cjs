// pnpm configuration to allow build scripts for required packages
module.exports = {
  hooks: {
    readPackage(pkg, context) {
      // Allow build scripts for these specific packages
      const allowedBuildScripts = [
        'ffmpeg-static',
        'bufferutil', 
        'puppeteer',
        'sharp'
      ];
      
      if (allowedBuildScripts.includes(pkg.name)) {
        // Ensure these packages can run their build scripts
        context.log(`Allowing build scripts for ${pkg.name}`);
        pkg.scripts = pkg.scripts || {};
      }
      
      return pkg;
    }
  }
};
