// Import dependencies.
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

// Import Configuration.
import { config } from '../configuration';

/**
 * Default modules loader for CSS.
 */
export const scss = {
  test: /\.s[ac]ss$/i,
  use: [
    config.IS_DEV ? 'style-loader' : MiniCssExtractPlugin.loader,
    {
      loader: 'css-loader',
    },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: () => [require('autoprefixer')],
        },
      },
    },
    {
      loader: 'sass-loader',
    },
  ],
  // exclude: /node_modules/,
};
