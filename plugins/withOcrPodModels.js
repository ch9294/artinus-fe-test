const { withPodfile } = require('expo/config-plugins');

// rn-mlkit-ocr 0.3.1 capitalizes selected model names in its Podfile mod,
// while its podspec checks for lowercase names. Restore the selected models.
module.exports = function withOcrPodModels(config) {
  return withPodfile(config, (podfile) => {
    const marker = /^\$ReactNativeOcrSubspecs = .*$/m;
    if (!marker.test(podfile.modResults.contents)) {
      throw new Error('rn-mlkit-ocr Podfile configuration was not generated');
    }
    podfile.modResults.contents = podfile.modResults.contents.replace(
      marker,
      "$ReactNativeOcrSubspecs = ['latin', 'korean']"
    );
    return podfile;
  });
};
