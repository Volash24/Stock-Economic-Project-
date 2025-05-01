from sklearn.linear_model import LinearRegression
  # or: from .data_manger import DataManager



import numpy as np
import statsmodels.api as sm
from services.data_manger import DataManager  # Ensure this has prepare_data()

class ModelPredictions:

    @staticmethod
    def train_linear_regression(data):
        """
        Trains an OLS linear regression model on the given dataset.

        :param data: Dictionary or DataFrame compatible with DataManager.prepare_data().
        :return: Trained model, predictions, and stats summary.
        """
        X, y = DataManager.prepare_data(data)
        X = sm.add_constant(np.array(X))  # Add intercept
        model = sm.OLS(y, X).fit()
        predictions = model.predict(X)
        return model, predictions

    @staticmethod
    def extract_summary(model):
        """
        Extracts R², coefficients, and p-values from a trained statsmodels OLS model.
        """
        return {
            'R²': round(model.rsquared, 4),
            'Intercept': round(model.params[0], 4),
            'Coefficients': {
                f"x{i}": round(val, 4)
                for i, val in enumerate(model.params[1:], start=1)
            },
            'P-values': {
                f"x{i}": round(p, 4)
                for i, p in enumerate(model.pvalues[1:], start=1)
            }
        }

    @staticmethod
    def to_markdown(summary):
        """
        Converts a regression summary to Markdown format (for Notion or readable logging).
        """
        md = f"### Model Summary\n- R²: **{summary['R²']}**\n- Intercept: **{summary['Intercept']}**\n"
        for key in summary['Coefficients']:
            coef = summary['Coefficients'][key]
            pval = summary['P-values'].get(key, 'N/A')
            md += f"- **{key}**: {coef} (p = {pval})\n"
        return md
