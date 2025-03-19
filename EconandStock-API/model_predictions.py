#model_predictions.py
from sklearn.linear_model import LinearRegression
from data_manger import DataManager

import numpy as np

class ModelPredictions:
    @staticmethod
    def train_and_predict(model_type, data):
        X, y = DataManager.prepare_data(data)
        # Ensure X is a 2D array
        X_reshaped = np.array(X).reshape(-1, 1)

        if model_type == "Linear Regression":
            model = LinearRegression().fit(X_reshaped, y)
        else:
            raise ValueError("Invalid Model Type!")

        predictions = model.predict(X_reshaped)
        return model, predictions
