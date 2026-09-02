import pandas as pd

class DataLoader:
    def load_csv(self, filepath: str) -> pd.DataFrame:
        df = pd.read_csv(filepath)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        return df
