# model.py
import json
import pandas as pd
import numpy as np
from typing import List, Dict, Tuple
from collections import defaultdict
import re
from gemini import suggest_task_details
from ml import TaskPredictorTextOnly  # ensure your ml.py defines this class
from database import db_connection

class FormulaYAssignmentEngine:
    """
    Formula Y: Advanced Task Assignment Algorithm
    Developed by Mohamed Taher Ben Slama - Digixi Intern
    
    This algorithm optimizes task assignment using three key factors:
    1. Skill Match Score (S): Technical compatibility between worker and task
    2. Workload Factor (W): Resource availability and overload prevention  
    3. Complexity Fit Factor (C): Experience-complexity alignment
    
    Final Score: Y = S × W × C
    """
    
    def __init__(self, workspace_id: str = None):
        """
        Initialize Formula Y with worker data from database
        
        Args:
            workspace_id: The workspace ID to fetch workers for
        """
        self.workspace_id = workspace_id
        self.workers_df = pd.DataFrame()
        self.worker_availability = {}  # Track hours assigned to each worker
        self.role_skill_mapping = self._create_role_skill_mapping()
        
        if workspace_id:
            self.load_workers_from_database(workspace_id)
        else:
            print("⚠️  No workspace_id provided. Workers will be loaded when needed.")
    
    def load_workers_from_database(self, workspace_id: str):
        """
        Load workers from database for a specific workspace
        
        Args:
            workspace_id: The workspace ID to fetch workers for
        """
        try:
            self.workers_df = db_connection.get_csv_workers_dataframe(workspace_id)
            print(f"✅ Loaded {len(self.workers_df)} workers from database for workspace {workspace_id}")
        except Exception as e:
            print(f"❌ Error loading workers from database: {e}")
            self.workers_df = pd.DataFrame(columns=["Name", "Role", "Technologies", "Experience"])
        
    def _create_sample_workers_data(self, csv_path):
        """Create sample workers.csv if not found"""
        sample_data = """Name,Role,Technologies,Experience
Alice,Backend Developer,Java:Spring Boot:SQL:Node.js,4:3:5:2
Bob,Frontend Developer,React:Vue:HTML:CSS:JavaScript,5:2:6:6:5
Charlie,UI/UX Designer,Figma:AdobeXD:Sketch:Photoshop,4:3:2:5
Diana,QA Engineer,Selenium:JMeter:Postman,3:4:3
Eve,DevOps Engineer,Docker:Kubernetes:Jenkins:AWS,4:2:3:5
Frank,Project Manager,Scrum:Kanban:Jira:Communication,5:4:5:6
Grace,Business Analyst,UML:UserStories:Communication:BPMN,4:3:5:4
Henry,Technical Writer,Markdown:Confluence:Diagrams.net:MSWord,5:3:4:6
Ivy,Solution Architect,AWS:Microservices:DesignPatterns:Kubernetes,6:5:6:3"""
        
        with open(csv_path, 'w') as f:
            f.write(sample_data)
        print(f"✅ Created sample {csv_path}")
        
    def _create_role_skill_mapping(self):
        """
        Map role names to relevant skills/technologies for better matching
        This helps Formula Y understand which skills are relevant for each role
        """
        return {
            'project manager': ['scrum', 'kanban', 'jira', 'communication', 'agile', 'management'],
            'product owner': ['communication', 'userstories', 'scrum', 'requirements', 'business'],
            'business analyst': ['uml', 'userstories', 'communication', 'bpmn', 'requirements', 'analysis'],
            'ux designer': ['figma', 'adobexd', 'sketch', 'photoshop', 'wireframes', 'design'],
            'ui designer': ['figma', 'adobexd', 'sketch', 'photoshop', 'css', 'design'],
            'solutions architect': ['aws', 'microservices', 'designpatterns', 'kubernetes', 'architecture'],
            'solution architect': ['aws', 'microservices', 'designpatterns', 'kubernetes', 'architecture'],
            'tech lead': ['java', 'spring', 'node.js', 'architecture', 'designpatterns', 'leadership'],
            'backend developer': ['java', 'spring boot', 'sql', 'node.js', 'python', 'api', 'database'],
            'frontend developer': ['react', 'vue', 'html', 'css', 'javascript', 'angular', 'ui'],
            'database administrator': ['sql', 'mysql', 'postgresql', 'mongodb', 'database'],
            'qa automation engineer': ['selenium', 'jmeter', 'postman', 'testing', 'automation'],
            'qa engineer': ['selenium', 'jmeter', 'postman', 'testing', 'manual testing'],
            'devops engineer': ['docker', 'kubernetes', 'jenkins', 'aws', 'ci/cd', 'deployment'],
            'cloud engineer': ['aws', 'azure', 'gcp', 'kubernetes', 'docker', 'cloud'],
            'security engineer': ['security', 'penetration testing', 'owasp', 'encryption'],
            'technical writer': ['markdown', 'confluence', 'diagrams.net', 'msword', 'documentation']
        }
    
    def _normalize_text(self, text):
        """Normalize text for better comparison"""
        if pd.isna(text) or text is None:
            return ""
        return str(text).lower().strip().replace(' ', '').replace('-', '').replace('_', '').replace('.', '')
    
    def _calculate_skill_match_score(self, worker_idx, required_roles):
        """
        Calculate Skill Match Score (S) - Formula Y Component 1
        
        Formula: S = α * R + β * Σ(T_i * E_i)
        Where:
        - R: Direct role match (0 or 10 points)
        - T_i: Technology relevance weight
        - E_i: Worker experience in technology i
        - α = 1.0, β = 1.5 (weighting parameters)
        
        Score Range: [0, 50+]
        """
        worker = self.workers_df.iloc[worker_idx]
        worker_role = self._normalize_text(worker.get('Role', ''))
        worker_technologies = str(worker.get('Technologies', '')).split(':')
        
        try:
            worker_experiences = list(map(float, str(worker.get('Experience', '0')).split(':')))
        except (ValueError, AttributeError):
            worker_experiences = [1.0] * len(worker_technologies)
        
        # Normalize worker technologies
        worker_tech_normalized = [self._normalize_text(tech) for tech in worker_technologies]
        
        total_score = 0
        role_matches = 0
        
        # Process each required role
        for role in required_roles:
            role_normalized = self._normalize_text(role)
            
            # Direct role match (α * R) - highest weight
            if role_normalized in worker_role or worker_role in role_normalized:
                role_matches += 1
                total_score += 10  # α = 1.0, R = 10
                continue
            
            # Technology skill matching (β * Σ(T_i * E_i))
            mapped_skills = self.role_skill_mapping.get(role_normalized, [])
            skill_score = 0
            
            for skill in mapped_skills:
                skill_normalized = self._normalize_text(skill)
                
                # Check if worker has this skill
                for i, worker_tech in enumerate(worker_tech_normalized):
                    if skill_normalized in worker_tech or worker_tech in skill_normalized:
                        if i < len(worker_experiences):
                            # β = 1.5, T_i = 1.0, E_i = experience years
                            skill_score += worker_experiences[i] * 1.5
                            break
            
            total_score += skill_score
        
        # Apply bonuses and penalties
        if role_matches > 1:
            total_score *= 1.2  # Multi-role bonus
        elif role_matches == 0:
            total_score *= 0.3  # No direct match penalty
            
        return max(0, total_score)
    
    def _calculate_workload_factor(self, worker_idx, estimated_time):
        """
        Calculate Workload Factor (W) - Formula Y Component 2
        
        Formula: W = 1.0 if ρ ≤ 1.0, else 1/(1 + 2(ρ - 1))
        Where: ρ = (current_load + task_time) / max_capacity
        
        Score Range: (0, 1]
        - 1.0 = Optimal workload
        - <1.0 = Overloaded (exponential penalty)
        """
        worker_name = self.workers_df.iloc[worker_idx]['Name']
        current_workload = self.worker_availability.get(worker_name, 0)
        
        # Default capacity: 160 hours (4 weeks × 40 hours)
        # Can be customized per worker for part-time staff
        max_capacity = 160
        workload_ratio = (current_workload + estimated_time) / max_capacity
        
        if workload_ratio <= 1.0:
            return 1.0  # No penalty for normal load
        else:
            # Exponential penalty for overload
            return 1.0 / (1 + 2 * (workload_ratio - 1.0))
    
    def _calculate_complexity_fit_factor(self, worker_idx, task_complexity, task_risk):
        """
        Calculate Complexity Fit Factor (C) - Formula Y Component 3
        
        Formula: C = max(0.1, F_exp * 0.7 + (1 - R) * T_risk * 0.3)
        Where:
        - F_exp: Experience fit (1 - |max_exp - scaled_complexity| / 6)
        - T_risk: Risk tolerance (avg_exp / 6)
        - R: Task risk level
        
        Score Range: [0.1, 1]
        """
        worker = self.workers_df.iloc[worker_idx]
        
        try:
            worker_experiences = list(map(float, str(worker.get('Experience', '0')).split(':')))
        except (ValueError, AttributeError):
            worker_experiences = [1.0]
        
        if not worker_experiences:
            return 0.5  # Default score
        
        avg_experience = np.mean(worker_experiences)
        max_experience = max(worker_experiences)
        
        # Scale task complexity (0-10) to experience scale (0-6)
        scaled_complexity = (task_complexity / 10) * 6
        
        # Experience fit: prefer workers with slightly higher experience than needed
        experience_fit = 1.0 - abs(max_experience - scaled_complexity) / 6
        experience_fit = max(0, min(1, experience_fit))
        
        # Risk tolerance: higher experience = better risk handling
        risk_tolerance = min(avg_experience / 6, 1.0)
        
        # Combined complexity fit
        complexity_fit = max(0.1, experience_fit * 0.7 + (1 - task_risk) * risk_tolerance * 0.3)
        
        return complexity_fit
    
    def assign_tasks(self, tasks_data, max_workers_per_task=3):
        """
        Main Formula Y assignment algorithm
        
        Process:
        1. Sort tasks by priority and complexity (high first)
        2. For each task, calculate Y = S × W × C for all workers
        3. Assign best-scoring workers (above threshold 0.1)
        4. Update worker availability
        
        Returns: List of assignment dictionaries
        """
        assignments = []
        
        print(f"\n🔄 Running Formula Y assignment for {len(tasks_data)} tasks...")
        
        # Sort tasks by priority and complexity (high priority, high complexity first)
        sorted_tasks = sorted(enumerate(tasks_data), 
                            key=lambda x: (x[1]['priority'], x[1]['complexity']), 
                            reverse=True)
        
        for task_idx, task in sorted_tasks:
            task_name = task['task']
            required_roles = task.get('roles', [])
            estimated_time = task.get('estimated_time', 0)
            complexity = task.get('complexity', 0)
            risk = task.get('risk', 0)
            
            # Parse roles if they're in string format
            if isinstance(required_roles, str):
                required_roles = [role.strip() for role in required_roles.replace('[', '').replace(']', '').replace("'", '').replace('"', '').split(',')]
            
            # Calculate Formula Y scores for all workers
            worker_scores = []
            
            for worker_idx in range(len(self.workers_df)):
                # Calculate three Formula Y components
                skill_score = self._calculate_skill_match_score(worker_idx, required_roles)
                workload_factor = self._calculate_workload_factor(worker_idx, estimated_time)
                complexity_fit = self._calculate_complexity_fit_factor(worker_idx, complexity, risk)
                
                # Formula Y: Y = S × W × C
                formula_y_score = skill_score * workload_factor * complexity_fit
                
                worker_scores.append((
                    worker_idx, 
                    formula_y_score, 
                    skill_score, 
                    workload_factor, 
                    complexity_fit
                ))
            
            # Sort by Formula Y score (descending)
            worker_scores.sort(key=lambda x: x[1], reverse=True)
            
            # Assign best workers (up to max_workers_per_task)
            assigned_workers = []
            
            for worker_data in worker_scores:
                worker_idx, total_score, skill_score, workload_factor, complexity_fit = worker_data
                
                if len(assigned_workers) >= max_workers_per_task:
                    break
                
                # Minimum score threshold for assignment
                if total_score > 0.1:
                    worker = self.workers_df.iloc[worker_idx]
                    worker_name = worker['Name']
                    worker_role = worker['Role']
                    
                    # Update worker availability
                    if worker_name not in self.worker_availability:
                        self.worker_availability[worker_name] = 0
                    
                    # Distribute time among assigned workers
                    time_per_worker = estimated_time / min(len(required_roles), max_workers_per_task)
                    self.worker_availability[worker_name] += time_per_worker
                    
                    assigned_workers.append({
                        'name': worker_name,
                        'role': worker_role,
                        'skill_score': round(skill_score, 2),
                        'workload_factor': round(workload_factor, 3),
                        'complexity_fit': round(complexity_fit, 3),
                        'formula_y_score': round(total_score, 2),
                        'assigned_time': round(time_per_worker, 2)
                    })
            
            assignments.append({
                'task_index': task_idx,
                'task_name': task_name,
                'required_roles': required_roles,
                'estimated_time': estimated_time,
                'complexity': complexity,
                'risk': risk,
                'priority': task['priority'],
                'assigned_workers': assigned_workers
            })
        
        return assignments
    
    def print_assignments(self, assignments):
        """Print Formula Y assignments in detailed format"""
        print("\n" + "="*80)
        print("🎯 FORMULA Y TASK ASSIGNMENTS")
        print("   Algorithm by Mohamed Taher Ben Slama - Digixi Intern")
        print("="*80)
        
        for assignment in assignments:
            print(f"\n📋 Task: {assignment['task_name']}")
            print(f"   ⏱️  Estimated Time: {assignment['estimated_time']} hours")
            print(f"   📊 Metrics: Complexity={assignment['complexity']:.2f} | Risk={assignment['risk']:.2f} | Priority={assignment['priority']:.2f}")
            print(f"   👥 Required Roles: {', '.join(assignment['required_roles'])}")
            
            if not assignment['assigned_workers']:
                print("   ❌ No suitable workers found (all scores below threshold)")
            else:
                print(f"   ✅ Assigned Workers ({len(assignment['assigned_workers'])}):")
                for i, worker in enumerate(assignment['assigned_workers'], 1):
                    print(f"      {i}. {worker['name']} ({worker['role']})")
                    print(f"         🎯 Formula Y Score: {worker['formula_y_score']} = S({worker['skill_score']}) × W({worker['workload_factor']}) × C({worker['complexity_fit']})")
                    print(f"         ⏰ Assigned Time: {worker['assigned_time']} hours")
            
            print("-" * 60)
        
        # Worker workload summary
        print(f"\n📊 WORKER WORKLOAD SUMMARY (Formula Y Distribution):")
        print("-" * 50)
        if not self.worker_availability:
            print("   No assignments made.")
        else:
            for worker_name, total_hours in sorted(self.worker_availability.items()):
                utilization = (total_hours / 160) * 100  # 160 hours = 4 weeks capacity
                if utilization > 100:
                    status = "🔴 OVERLOADED"
                elif utilization > 80:
                    status = "🟡 HIGH LOAD"
                elif utilization > 50:
                    status = "🟢 NORMAL"
                else:
                    status = "🔵 LIGHT LOAD"
                
                print(f"   {worker_name}: {total_hours:.1f}h ({utilization:.1f}%) {status}")

def predict_tasks(project_description):
    from gemini import suggest_task_details
    from ml import TaskPredictorTextOnly
    import json
    details_json = suggest_task_details(project_description)
    if not details_json:
        raise ValueError("Empty response from Gemini.")
    
    try:
        tasks_info = json.loads(details_json)
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON from Gemini response.")
    predictor = TaskPredictorTextOnly()
    predictor.load_models("models")
    predicted_tasks = []
    for task_info in tasks_info:
        task_text = task_info.get("task", "Unknown Task")
        duration = task_info.get("duration", "Unknown")
        roles = task_info.get("roles", "")
        roles = roles if isinstance(roles, list) else [roles]
        preds = predictor.predict(task_text=task_text)
        predicted_tasks.append({
            "task": task_text,
            "duration": duration,
            "roles": roles,
            "complexity": preds["complexity"],
            "risk": preds["risk"],
            "priority": preds["priority"]
        })
    return predicted_tasks

def calculate_task_times(tasks_data, workspace_id=None, base_time=10):
    """
    Calculate estimated time E_T for each task using the original time estimation formula
    
    Args:
        tasks_data: List of task dictionaries with complexity, risk, priority
        workspace_id: Workspace ID to fetch workers from database
        base_time: Base time B_T (default: 10)
    
    Returns:
        List of task dictionaries with added 'estimated_time' field
    """
    try:
        # Load workers from database if workspace_id provided
        if workspace_id:
            workers_df = db_connection.get_csv_workers_dataframe(workspace_id)
        else:
            # Fallback to empty DataFrame
            workers_df = pd.DataFrame(columns=["Name", "Role", "Technologies", "Experience"])
        
        T = len(workers_df)  # Total number of workers
        
        # Convert tasks to DataFrame for easier processing
        tasks_df = pd.DataFrame(tasks_data)
        
        # Normalize columns
        C_max = tasks_df['complexity'].max() if len(tasks_df) > 0 else 1
        R_max = tasks_df['risk'].max() if len(tasks_df) > 0 else 1
        Pr_max = tasks_df['priority'].max() if len(tasks_df) > 0 else 1
        
        # Calculate skill match score S for each task
        def skill_score(task_roles):
            """Calculate skill score based on worker technologies and experience"""
            if not task_roles or not isinstance(task_roles, list):
                return 1.0  # Default score if no roles specified
                
            total_score = 0
            for _, row in workers_df.iterrows():
                if 'Technologies' in row and 'Experience' in row:
                    try:
                        techs = str(row['Technologies']).split(':')
                        exps = list(map(float, str(row['Experience']).split(':')))
                        
                        for role in task_roles:
                            role_str = str(role).strip()
                            if role_str in techs:
                                idx = techs.index(role_str)
                                if idx < len(exps):
                                    total_score += exps[idx]
                    except (ValueError, IndexError):
                        continue  # Skip invalid data
            
            return max(total_score, 1.0)  # Ensure minimum score of 1
        
        # Add skill scores to tasks
        for i, task in enumerate(tasks_data):
            task_roles = task.get('roles', [])
            tasks_df.loc[i, 'S'] = skill_score(task_roles)
        
        S_max = tasks_df['S'].max() if len(tasks_df) > 0 else 1
        T_max = T
        P_T = T  # assume all are participating
        B_T = base_time
        
        # Calculate E_T for each task
        def compute_E_T(row):
            C, R, Pr, S = row['complexity'], row['risk'], row['priority'], row['S']
            
            # Avoid division by zero
            C_norm = C / C_max if C_max > 0 else 0
            R_norm = R / R_max if R_max > 0 else 0
            Pr_norm = Pr / Pr_max if Pr_max > 0 else 0
            S_factor = S_max / S if S > 0 else 1
            
            term1 = 0.8 * B_T * (1 + C_norm + R_norm + Pr_norm)
            term2 = 0.2 * B_T * ((0.05 * (T / T_max)) + (0.05 * S_factor) + (0.05 * (P_T / T)))
            
            return round(term1 + term2, 2)
        
        tasks_df['E_T'] = tasks_df.apply(compute_E_T, axis=1)
        
        # Add estimated time back to original tasks data
        for i, task in enumerate(tasks_data):
            task['estimated_time'] = tasks_df.loc[i, 'E_T']
        
        return tasks_data
        
    except Exception as e:
        print(f"Error in calculate_task_times: {e}")
        # Fallback calculation without workers data
        for task in tasks_data:
            # Simple fallback formula
            complexity_factor = task.get('complexity', 1)
            risk_factor = task.get('risk', 1)
            priority_factor = task.get('priority', 1)
            task['estimated_time'] = round(base_time * (1 + complexity_factor + risk_factor + priority_factor) * 0.3, 2)
        
        return tasks_data
        print(f"Error in time calculation: {e}")
        # Add default estimated time
        for task in tasks_data:
            task['estimated_time'] = base_time
        return tasks_data

def main():
    print("="*60)
    print("🚀 PROJECT TASK PREDICTION & ASSIGNMENT SYSTEM")
    print("   Powered by Formula Y Algorithm")
    print("   Developed by Mohamed Taher Ben Slama - Digixi Intern")
    print("="*60)
    
    # Input project info
    project_title = input("\n📝 Enter project title: ")
    project_description = input("📋 Enter project description: ")
    
    print(f"\n🔄 Processing project: {project_title}")
    print("\n1️⃣ Requesting task details from Gemini...")
    details_json = suggest_task_details(project_description)
    
    print("\n📄 Raw Gemini output:")
    print(details_json)
    
    if not details_json:
        raise ValueError("Gemini API returned empty response. Cannot parse tasks.")
    
    try:
        tasks_info = json.loads(details_json)
    except json.JSONDecodeError:
        print("\n❌ ERROR: Could not parse JSON from Gemini output.")
        snippet = details_json[:500] + ("..." if len(details_json) > 500 else "")
        print(f"Output snippet:\n{snippet}")
        raise
    
    print(f"\n2️⃣ Loading ML models for task prediction...")
    # Initialize predictor and load pre-trained models if available
    predictor = TaskPredictorTextOnly()
    try:
        predictor.load_models("models")
        print("✅ Loaded pre-trained SVR models from 'models/'")
    except Exception as e:
        print("\n❌ Pre-trained models not found. Please train models first.")
        print("Run: python ml.py to train the models")
        print("Error:", e)
        return
    
    print(f"\n3️⃣ Generating predictions for {len(tasks_info)} tasks...")
    # Prepare tasks data with predictions
    predicted_tasks = []
    for task_info in tasks_info:
        task = task_info.get("task", "Unknown Task")
        duration = task_info.get("duration", "Unknown")
        roles = task_info.get("roles", "Unknown")
        roles = roles if isinstance(roles, list) else [roles] if roles != "Unknown" else []
        
        # Predict using only the task description
        pred = predictor.predict(task_text=task)
        
        predicted_tasks.append({
            "task": task,
            "duration": duration,
            "roles": roles,
            "complexity": pred['complexity'],
            "risk": pred['risk'],
            "priority": pred['priority']
        })
    
    print("\n4️⃣ Calculating estimated times using time formula...")
    # Calculate estimated times using the formula
    try:
        predicted_tasks = calculate_task_times(predicted_tasks)
        print("✅ Time calculations completed successfully.")
    except Exception as e:
        print(f"⚠️  Warning: Time calculation failed: {e}")
    
    print("\n5️⃣ Running Formula Y task assignment algorithm...")
    # Apply Formula Y assignment algorithm
    try:
        formula_y_engine = FormulaYAssignmentEngine("workers.csv")
        assignments = formula_y_engine.assign_tasks(predicted_tasks)
        formula_y_engine.print_assignments(assignments)
        
        print(f"\n✅ Formula Y assignment completed successfully!")
        print(f"   📊 {len(assignments)} tasks processed")
        print(f"   👥 {len(formula_y_engine.worker_availability)} workers utilized")
        
    except Exception as e:
        print(f"⚠️  Warning: Formula Y assignment failed: {e}")
        print("📋 Proceeding with basic task display...")
        
        # Fallback to basic display
        print(f"\nProject: {project_title}")
        print("="*50)
        print("\nTask Predictions:")
        
        for i, task_data in enumerate(predicted_tasks, 1):
            print(f"\n{i}. Task: {task_data['task']}")
            print(f"   Roles: {task_data['roles']}")
            print(f"   Complexity: {task_data['complexity']:.2f}")
            print(f"   Risk: {task_data['risk']:.2f}")
            print(f"   Priority: {task_data['priority']:.2f}")
            if 'estimated_time' in task_data:
                print(f"   Estimated Time: {task_data['estimated_time']} hours")

if __name__ == "__main__":
    main()
