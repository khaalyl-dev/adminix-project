# gemini.py
from dotenv import load_dotenv
import os
import google.generativeai as genai

load_dotenv()

# Configuration - Set to True to disable Gemini API completely
DISABLE_GEMINI = os.getenv("DISABLE_GEMINI", "false").lower() == "true"

# Initialize Gemini model
model = None
if not DISABLE_GEMINI:
    try:
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        # Try different models in order of preference
        model_names = [
            'gemini-1.5-flash',  # Faster, more available
            'gemini-1.5-flash-latest',
            'gemini-2.0-flash',
            'gemini-1.5-pro-latest'
        ]
        
        for model_name in model_names:
            try:
                model = genai.GenerativeModel(model_name)
                print(f"✅ Using Gemini model: {model_name}")
                break
            except Exception as e:
                print(f"⚠️  Failed to load {model_name}: {e}")
                continue
        
        if not model:
            print("⚠️  Could not load any Gemini model. Using fallback only.")
            
    except Exception as e:
        print(f"❌ Error initializing Gemini: {e}")
        model = None
else:
    print("⚠️  Gemini API disabled by configuration. Using fallback only.")

def suggest_task_details(project_description):
    if not model:
        print("⚠️  Gemini API not available. Using fallback task suggestions.")
        return get_fallback_tasks(project_description)
    
    prompt = f"""Given this project description: "{project_description}"

Please generate a JSON array of 10 detailed tasks for this project. Each task should include:
- A clear, actionable task name
- Estimated duration in hours
- Required roles/skills
- Brief description of what needs to be done

Return ONLY valid JSON in this exact format:
[
  {{
    "task": "Task name here",
    "duration": 8,
    "roles": ["Frontend Developer", "UI/UX Designer"],
    "description": "Brief description of what needs to be done"
  }}
]

Make sure the tasks are realistic, well-scoped, and cover different aspects of the project."""

    # Enhanced retry logic with better rate limit handling
    max_retries = 3
    for attempt in range(max_retries + 1):
        try:
            import time
            import threading
            import platform
            
            # Cross-platform timeout implementation
            timeout_occurred = False
            
            def timeout_handler():
                nonlocal timeout_occurred
                timeout_occurred = True
            
            # Use threading.Timer for cross-platform timeout
            timer = threading.Timer(30.0, timeout_handler)
            
            try:
                if attempt > 0:
                    print(f"🔄 Retry attempt {attempt} for Gemini API call...")
                    # Progressive backoff for rate limiting
                    wait_time = 5 * (attempt + 1)
                    print(f"⏳ Waiting {wait_time} seconds before retry...")
                    time.sleep(wait_time)
                else:
                    print("🤖 Calling Gemini API for enhanced task suggestions...")
                
                # Start timeout timer
                timer.start()
                
                # Make the API call
                response = model.generate_content(prompt)
                
                # Cancel timer if successful
                timer.cancel()
                
                # Check if timeout occurred
                if timeout_occurred:
                    raise TimeoutError("Gemini API call timed out")
                
                text = response.text.strip()
                
                # Try to extract JSON from the response
                try:
                    import json
                    # Find JSON array in the response
                    start_idx = text.find('[')
                    end_idx = text.rfind(']') + 1
                    if start_idx != -1 and end_idx != 0:
                        json_text = text[start_idx:end_idx]
                        tasks = json.loads(json_text)
                        print(f"✅ Successfully generated {len(tasks)} enhanced tasks via Gemini API")
                        return json.dumps(tasks, indent=2)
                    else:
                        print("⚠️  Could not find valid JSON in Gemini response. Using fallback.")
                        return get_fallback_tasks(project_description)
                except json.JSONDecodeError as e:
                    print(f"⚠️  Invalid JSON from Gemini API: {e}. Using fallback.")
                    return get_fallback_tasks(project_description)
                    
            except TimeoutError:
                print(f"⚠️  Gemini API call timed out after 30 seconds (attempt {attempt + 1}/{max_retries + 1}).")
                if attempt < max_retries:
                    print("🔄 Retrying...")
                    continue
                else:
                    print("⚠️  All attempts failed. Using fallback tasks.")
                    return get_fallback_tasks(project_description)
            finally:
                timer.cancel()  # Ensure timer is cancelled
                
        except Exception as e:
            error_str = str(e).lower()
            
            # Check for rate limit related errors
            if any(keyword in error_str for keyword in ["429", "quota", "rate", "limit", "exceeded"]):
                print(f"⚠️  Rate limit detected (attempt {attempt + 1}): Using fallback tasks immediately.")
                return get_fallback_tasks(project_description)
            else:
                print(f"❌ Error calling Gemini API (attempt {attempt + 1}): {e}")
                if attempt < max_retries:
                    print("🔄 Retrying...")
                    continue
                else:
                    print("❌ All attempts failed. Using fallback tasks.")
                    return get_fallback_tasks(project_description)
    
    # Fallback if all retries fail
    print("⚠️  Using fallback tasks due to API issues.")
    return get_fallback_tasks(project_description)

def get_fallback_tasks(project_description):
    """Fallback task suggestions when Gemini API is not available"""
    import json
    
    # Enhanced fallback tasks with better structure
    fallback_tasks = [
        {
            "task": "Project Planning and Requirements Analysis",
            "duration": 16,
            "roles": ["Project Manager", "Business Analyst"],
            "description": "Define project scope, gather requirements, and create project plan"
        },
        {
            "task": "System Architecture Design",
            "duration": 24,
            "roles": ["Solution Architect", "Tech Lead"],
            "description": "Design system architecture, technology stack, and infrastructure"
        },
        {
            "task": "Database Design and Setup",
            "duration": 12,
            "roles": ["Backend Developer", "Database Administrator"],
            "description": "Design database schema, set up database, and configure connections"
        },
        {
            "task": "Backend API Development",
            "duration": 40,
            "roles": ["Backend Developer"],
            "description": "Develop RESTful APIs, implement business logic, and handle data processing"
        },
        {
            "task": "Frontend Development",
            "duration": 32,
            "roles": ["Frontend Developer"],
            "description": "Build user interface components, implement user interactions, and integrate with APIs"
        },
        {
            "task": "UI/UX Design",
            "duration": 20,
            "roles": ["UI/UX Designer"],
            "description": "Create user interface designs, wireframes, and user experience flows"
        },
        {
            "task": "Testing and Quality Assurance",
            "duration": 16,
            "roles": ["QA Engineer"],
            "description": "Write test cases, perform testing, and ensure code quality"
        },
        {
            "task": "DevOps and Deployment",
            "duration": 12,
            "roles": ["DevOps Engineer"],
            "description": "Set up CI/CD pipelines, configure deployment environments, and manage infrastructure"
        },
        {
            "task": "Documentation",
            "duration": 8,
            "roles": ["Technical Writer"],
            "description": "Create technical documentation, user guides, and API documentation"
        },
        {
            "task": "Project Review and Handover",
            "duration": 8,
            "roles": ["Project Manager"],
            "description": "Conduct project review, prepare handover documentation, and close project"
        }
    ]
    
    print("✅ Using fallback task suggestions (no rate limit issues)")
    return json.dumps(fallback_tasks, indent=2)

if __name__ == "__main__":
    desc = input("Enter project description: ")
    output = suggest_task_details(desc)
    print("Gemini JSON output:")
    print(output)
