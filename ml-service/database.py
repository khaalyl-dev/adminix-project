"""
Database connection for ML Service
Connects to the main application database to fetch CSV workers
"""

import os
import pymongo
from bson import ObjectId
from typing import List, Dict, Any
import pandas as pd
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DatabaseConnection:
    def __init__(self):
        # Get database connection details from environment
        # Backend uses MONGO_URL, so prioritize that
        self.mongo_uri = os.getenv("MONGO_URL") or os.getenv("MONGODB_URI") or "mongodb+srv://benananekhalilo:35QIyywSYoyaLKMv@adminix.5n7bbvw.mongodb.net/?retryWrites=true&w=majority&appName=adminix"
        
        # Check environment to determine database name
        node_env = os.getenv("NODE_ENV", "development")
        if node_env == "development":
            self.database_name = "test"  # Backend uses 'test' database in development
        else:
            # Extract database name from connection string or use default
            if "adminix" in self.mongo_uri:
                self.database_name = "adminix"
            else:
                self.database_name = os.getenv("DATABASE_NAME", "adminix")
        self.client = None
        self.db = None
        print(f"🔧 ML Service - Database: {self.database_name}")
        
    def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = pymongo.MongoClient(self.mongo_uri)
            self.client.admin.command('ping')
            self.db = self.client[self.database_name]
            print(f"✅ ML Service connected to database: {self.database_name}")
            return True
        except Exception as e:
            print(f"❌ ML Service database connection failed: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            print("✅ Disconnected from MongoDB")
    
    def get_csv_workers(self, workspace_id: str) -> List[Dict[str, Any]]:
        """
        Fetch CSV workers from the database for a specific workspace
        
        Args:
            workspace_id: The workspace ID to fetch workers for
            
        Returns:
            List of worker dictionaries
        """
        try:
            if self.db is None:
                if not self.connect():
                    return []
            
            # Fetch CSV workers from the database
            try:
                workspace_object_id = ObjectId(workspace_id)
                csv_workers = list(self.db.csvworkers.find({"workspaceId": workspace_object_id}))
            except Exception:
                # If workspace_id is not a valid ObjectId, try as string
                csv_workers = list(self.db.csvworkers.find({"workspaceId": workspace_id}))
            
            print(f"🔍 Found {len(csv_workers)} CSV workers for workspace {workspace_id}")
            
            # Convert to the format expected by Formula Y
            workers_data = []
            for worker in csv_workers:
                # Convert technologies array to colon-separated string
                technologies = worker.get("technologies", [])
                technologies_str = ":".join(technologies) if technologies else ""
                
                # Convert experience array to colon-separated string
                # Handle both array of numbers and array of objects with $numberInt
                experience = worker.get("experience", [])
                experience_values = []
                for exp in experience:
                    if isinstance(exp, dict) and "$numberInt" in exp:
                        experience_values.append(str(exp["$numberInt"]))
                    elif isinstance(exp, (int, float)):
                        experience_values.append(str(exp))
                    else:
                        experience_values.append(str(exp))
                
                experience_str = ":".join(experience_values)
                
                workers_data.append({
                    "Name": worker.get("name", ""),
                    "Role": worker.get("role", ""),
                    "Technologies": technologies_str,
                    "Experience": experience_str
                })
            
            print(f"✅ Successfully loaded {len(workers_data)} CSV workers")
            return workers_data
            
        except Exception as e:
            print(f"❌ Error loading CSV workers: {e}")
            return []
    
    def get_csv_workers_dataframe(self, workspace_id: str) -> pd.DataFrame:
        """
        Fetch CSV workers and return as pandas DataFrame
        
        Args:
            workspace_id: The workspace ID to fetch workers for
            
        Returns:
            Pandas DataFrame with worker data
        """
        workers_data = self.get_csv_workers(workspace_id)
        
        if not workers_data:
            # Return empty DataFrame with correct columns
            return pd.DataFrame(columns=["Name", "Role", "Technologies", "Experience"])
        
        # Convert to DataFrame
        df = pd.DataFrame(workers_data)
        
        # Parse technologies and experience columns
        if not df.empty:
            # Split technologies into lists
            df["Technologies"] = df["Technologies"].apply(lambda x: x.split(":") if x else [])
            
            # Split experience into lists of integers
            df["Experience"] = df["Experience"].apply(
                lambda x: [int(exp) for exp in x.split(":")] if x else []
            )
        
        return df

# Global database connection instance
db_connection = DatabaseConnection() 