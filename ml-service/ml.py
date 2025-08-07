"""
Author: Mohamed Taher Ben Slama
Intern at Digixi

Simplified ML module for task prediction using text-only features
Compatible with model.py interface
"""

import pandas as pd
import numpy as np
import os
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import SVR
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
import ast

class TaskPredictorTextOnly:
    def __init__(self):
        self.complexity_model = None
        self.risk_model = None
        self.priority_model = None
        self.vectorizer = None
        self.scaler = None
        self.is_trained = False
    
    def _parse_skill_list(self, skill_str):
        """Parse skill string into list"""
        if pd.isna(skill_str) or skill_str == '':
            return []
        try:
            if skill_str.startswith('[') and skill_str.endswith(']'):
                return ast.literal_eval(skill_str)
            else:
                return [skill.strip() for skill in skill_str.split(',') if skill.strip()]
        except:
            return [skill.strip() for skill in str(skill_str).split(',') if skill.strip()]
    
    def train(self, csv_path="big_dataset.csv"):
        """Train the models using the dataset"""
        print("Loading and preprocessing dataset...")
        
        # Load dataset
        df = pd.read_csv(csv_path, header=0)
        df.columns = [col.strip() for col in df.columns]
        
        print(f"Dataset shape: {df.shape}")
        print(f"Columns: {df.columns.tolist()}")
        
        # Clean and prepare data
        df.dropna(subset=["Complexity Score", "Risk"], inplace=True)
        
        # Risk mapping
        risk_map = {"low": 0.0, "medium": 0.5, "high": 1.0}
        df["risk"] = df["Risk"].str.lower().str.strip().map(risk_map).fillna(0.5)
        
        # Convert complexity score
        df["complexity_score"] = pd.to_numeric(df["Complexity Score"], errors='coerce')
        df["complexity_score"] = df["complexity_score"].fillna(df["complexity_score"].median())
        
        # Compute priority as a weighted combination of risk and complexity
        df["priority"] = 0.6 * df["risk"] + 0.4 * (df["complexity_score"] / 10.0)
        
        # Prepare text features - combine all available text
        text_features = []
        
        if "Task" in df.columns:
            text_features.append(df["Task"].fillna(""))
        
        if "Project Title" in df.columns:
            text_features.append(df["Project Title"].fillna(""))
        elif "project_title" in df.columns:
            text_features.append(df["project_title"].fillna(""))
        
        if "Assigned Roles" in df.columns:
            text_features.append(df["Assigned Roles"].fillna(""))
        
        if "Required Skills" in df.columns:
            skills_text = df["Required Skills"].apply(
                lambda x: " ".join(self._parse_skill_list(x)) if pd.notna(x) else ""
            )
            text_features.append(skills_text)
        
        if "Recommended Skills" in df.columns:
            rec_skills_text = df["Recommended Skills"].apply(
                lambda x: " ".join(self._parse_skill_list(x)) if pd.notna(x) else ""
            )
            text_features.append(rec_skills_text)
        
        combined_text = pd.Series([" ".join(texts) for texts in zip(*text_features)])
        print(f"Sample combined text: {combined_text.iloc[0][:200]}...")
        
        # Vectorize text
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 2),
            stop_words='english',
            min_df=2
        )
        
        X_text = self.vectorizer.fit_transform(combined_text)
        
        # Targets
        y_complexity = df["complexity_score"].values
        y_risk = df["risk"].values
        y_priority = df["priority"].values
        
        print(f"Feature matrix shape: {X_text.shape}")
        print(f"Target ranges - Complexity: [{y_complexity.min():.2f}, {y_complexity.max():.2f}]")
        print(f"Target ranges - Risk: [{y_risk.min():.2f}, {y_risk.max():.2f}]")
        print(f"Target ranges - Priority: [{y_priority.min():.2f}, {y_priority.max():.2f}]")
        
        # Scale features
        self.scaler = StandardScaler(with_mean=False)
        X_scaled = self.scaler.fit_transform(X_text)
        
        # Split data
        X_train, X_test, y_comp_train, y_comp_test = train_test_split(
            X_scaled, y_complexity, test_size=0.2, random_state=42
        )
        
        _, _, y_risk_train, y_risk_test = train_test_split(
            X_scaled, y_risk, test_size=0.2, random_state=42
        )
        
        _, _, y_prio_train, y_prio_test = train_test_split(
            X_scaled, y_priority, test_size=0.2, random_state=42
        )
        
        # Train models
        print("Training complexity model...")
        self.complexity_model = SVR(kernel='rbf', C=100, gamma='scale')
        self.complexity_model.fit(X_train, y_comp_train)
        
        print("Training risk model...")
        self.risk_model = SVR(kernel='rbf', C=100, gamma='scale')
        self.risk_model.fit(X_train, y_risk_train)
        
        print("Training priority model...")
        self.priority_model = SVR(kernel='rbf', C=100, gamma='scale')
        self.priority_model.fit(X_train, y_prio_train)
        
        # Evaluate models
        comp_pred = self.complexity_model.predict(X_test)
        risk_pred = self.risk_model.predict(X_test)
        prio_pred = self.priority_model.predict(X_test)
        
        print("\nModel Performance:")
        print(f"Complexity - MAE: {mean_absolute_error(y_comp_test, comp_pred):.4f}, "
              f"RMSE: {np.sqrt(mean_squared_error(y_comp_test, comp_pred)):.4f}")
        print(f"Risk - MAE: {mean_absolute_error(y_risk_test, risk_pred):.4f}, "
              f"RMSE: {np.sqrt(mean_squared_error(y_risk_test, risk_pred)):.4f}")
        print(f"Priority - MAE: {mean_absolute_error(y_prio_test, prio_pred):.4f}, "
              f"RMSE: {np.sqrt(mean_squared_error(y_prio_test, prio_pred)):.4f}")
        
        self.is_trained = True
        print("Training completed successfully!")
    
    def save_models(self, model_dir="models"):
        """Save trained models to directory"""
        if not self.is_trained:
            raise ValueError("Models must be trained before saving")
        
        os.makedirs(model_dir, exist_ok=True)
        
        joblib.dump(self.complexity_model, os.path.join(model_dir, "complexity_model.pkl"))
        joblib.dump(self.risk_model, os.path.join(model_dir, "risk_model.pkl"))
        joblib.dump(self.priority_model, os.path.join(model_dir, "priority_model.pkl"))
        joblib.dump(self.vectorizer, os.path.join(model_dir, "vectorizer.pkl"))
        joblib.dump(self.scaler, os.path.join(model_dir, "scaler.pkl"))
        
        print(f"Models saved to {model_dir}/")
    
    def load_models(self, model_dir="models"):
        """Load pre-trained models from directory"""
        try:
            self.complexity_model = joblib.load(os.path.join(model_dir, "complexity_model.pkl"))
            self.risk_model = joblib.load(os.path.join(model_dir, "risk_model.pkl"))
            self.priority_model = joblib.load(os.path.join(model_dir, "priority_model.pkl"))
            self.vectorizer = joblib.load(os.path.join(model_dir, "vectorizer.pkl"))
            self.scaler = joblib.load(os.path.join(model_dir, "scaler.pkl"))
            
            self.is_trained = True
            print(f"Models loaded from {model_dir}/")
        except Exception as e:
            raise Exception(f"Failed to load models from {model_dir}/: {str(e)}")
    
    def predict(self, task_text):
        """Predict complexity, risk, and priority for a given task text"""
        if not self.is_trained:
            raise ValueError("Models must be trained or loaded before prediction")
        
        # Vectorize the input text
        X_text = self.vectorizer.transform([task_text])
        X_scaled = self.scaler.transform(X_text)
        
        # Make predictions
        complexity = float(self.complexity_model.predict(X_scaled)[0])
        risk = float(self.risk_model.predict(X_scaled)[0])
        priority = float(self.priority_model.predict(X_scaled)[0])
        
        # Ensure predictions are within reasonable bounds
        complexity = max(0, min(10, complexity))  # Assuming 0-10 scale
        risk = max(0, min(1, risk))  # 0-1 scale
        priority = max(0, min(1, priority))  # 0-1 scale
        
        return {
            "complexity": complexity,
            "risk": risk,
            "priority": priority
        }

# Training script
def train_models():
    """Train and save models"""
    print("Training TaskPredictorTextOnly models...")
    
    predictor = TaskPredictorTextOnly()
    predictor.train("big_dataset.csv")
    predictor.save_models("models")
    
    print("Training completed and models saved!")

if __name__ == "__main__":
    # Train models if run directly
    train_models()
    
    # Test with sample prediction
    predictor = TaskPredictorTextOnly()
    predictor.load_models("models")
    
    sample_task = "Develop user authentication system with login and registration"
    result = predictor.predict(sample_task)
    print(f"\nSample prediction for: '{sample_task}'")
    print(f"Complexity: {result['complexity']:.2f}")
    print(f"Risk: {result['risk']:.2f}")
    print(f"Priority: {result['priority']:.2f}")
