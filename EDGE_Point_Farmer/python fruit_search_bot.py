import pyautogui
import time
import json
import subprocess
import platform
from typing import List, Dict
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
import threading
import os

class FruitSearchBot:
    def __init__(self):
        self.is_running = False
        self.current_index = 0
        self.fruits = []
        self.delay = 3
        
        # Setup PyAutoGUI safety features
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 0.5
        
        # Create GUI
        self.setup_gui()
        
        # Load default fruits
        self.load_default_fruits()
    
    def setup_gui(self):
        """Create the GUI interface"""
        self.root = tk.Tk()
        self.root.title("Fruit Search Automation Bot")
        self.root.geometry("800x600")
        self.root.configure(bg='#f0f0f0')
        
        # Style
        style = ttk.Style()
        style.theme_use('clam')
        
        # Main frame
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Title
        title_label = ttk.Label(main_frame, text="🍎 Fruit Search Bot 🍊", 
                                font=('Arial', 24, 'bold'))
        title_label.grid(row=0, column=0, columnspan=3, pady=10)
        
        # Instructions
        instructions = ttk.Label(main_frame, 
                                text="This bot will open Edge and search for fruits using keyboard automation.\n"
                                     "Move mouse to top-left corner to emergency stop!",
                                font=('Arial', 10),
                                foreground='red')
        instructions.grid(row=1, column=0, columnspan=3, pady=5)
        
        # Fruit list section
        ttk.Label(main_frame, text="Fruit List (one per line):", 
                 font=('Arial', 12)).grid(row=2, column=0, sticky=tk.W, pady=5)
        
        self.fruit_text = scrolledtext.ScrolledText(main_frame, width=50, height=15)
        self.fruit_text.grid(row=3, column=0, columnspan=2, pady=5)
        
        # Control panel
        control_frame = ttk.Frame(main_frame)
        control_frame.grid(row=3, column=2, padx=10, sticky=tk.N)
        
        # Delay setting
        ttk.Label(control_frame, text="Delay (seconds):").pack(pady=5)
        self.delay_var = tk.StringVar(value="3")
        delay_spinbox = ttk.Spinbox(control_frame, from_=1, to=60, 
                                    textvariable=self.delay_var, width=10)
        delay_spinbox.pack(pady=5)
        
        # Browser selection
        ttk.Label(control_frame, text="Browser:").pack(pady=5)
        self.browser_var = tk.StringVar(value="edge")
        browser_combo = ttk.Combobox(control_frame, textvariable=self.browser_var,
                                     values=["edge", "chrome", "firefox"],
                                     state="readonly", width=10)
        browser_combo.pack(pady=5)
        
        # Buttons
        ttk.Button(control_frame, text="Load Defaults", 
                  command=self.load_default_fruits).pack(pady=5, fill=tk.X)
        
        ttk.Button(control_frame, text="Save List", 
                  command=self.save_fruits).pack(pady=5, fill=tk.X)
        
        ttk.Button(control_frame, text="Load List", 
                  command=self.load_fruits).pack(pady=5, fill=tk.X)
        
        self.start_btn = ttk.Button(control_frame, text="▶ START", 
                                   command=self.start_searching)
        self.start_btn.pack(pady=5, fill=tk.X)
        
        self.stop_btn = ttk.Button(control_frame, text="⏹ STOP", 
                                  command=self.stop_searching, state=tk.DISABLED)
        self.stop_btn.pack(pady=5, fill=tk.X)
        
        # Progress bar
        self.progress_var = tk.DoubleVar()
        self.progress_bar = ttk.Progressbar(main_frame, variable=self.progress_var,
                                           maximum=100, length=400)
        self.progress_bar.grid(row=4, column=0, columnspan=3, pady=10, sticky=(tk.W, tk.E))
        
        # Status label
        self.status_var = tk.StringVar(value="Ready to start searching...")
        self.status_label = ttk.Label(main_frame, textvariable=self.status_var,
                                     font=('Arial', 10))
        self.status_label.grid(row=5, column=0, columnspan=3, pady=5)
        
        # Current search display
        self.current_search_var = tk.StringVar(value="")
        self.current_search_label = ttk.Label(main_frame, 
                                             textvariable=self.current_search_var,
                                             font=('Arial', 12, 'bold'),
                                             foreground='blue')
        self.current_search_label.grid(row=6, column=0, columnspan=3, pady=5)
    
    def load_default_fruits(self):
        """Load default fruit list"""
        default_fruits = [
            "Apple", "Banana", "Orange", "Mango", "Strawberry",
            "Pineapple", "Watermelon", "Grapes", "Kiwi", "Peach",
            "Pear", "Cherry", "Plum", "Apricot", "Coconut",
            "Papaya", "Guava", "Pomegranate", "Lychee", "Dragon Fruit",
            "Passion Fruit", "Avocado", "Blueberry", "Raspberry", "Blackberry",
            "Cranberry", "Grapefruit", "Lemon", "Lime", "Tangerine",
            "Fig", "Date"
        ]
        self.fruit_text.delete(1.0, tk.END)
        self.fruit_text.insert(1.0, '\n'.join(default_fruits))
        self.status_var.set("Default fruits loaded!")
    
    def save_fruits(self):
        """Save fruit list to JSON file"""
        fruits = self.fruit_text.get(1.0, tk.END).strip().split('\n')
        fruits = [f.strip() for f in fruits if f.strip()]
        
        with open('fruits.json', 'w') as f:
            json.dump({'fruits': fruits}, f, indent=2)
        
        self.status_var.set(f"Saved {len(fruits)} fruits to fruits.json")
    
    def load_fruits(self):
        """Load fruit list from JSON file"""
        try:
            with open('fruits.json', 'r') as f:
                data = json.load(f)
                fruits = data.get('fruits', [])
                self.fruit_text.delete(1.0, tk.END)
                self.fruit_text.insert(1.0, '\n'.join(fruits))
                self.status_var.set(f"Loaded {len(fruits)} fruits from fruits.json")
        except FileNotFoundError:
            messagebox.showwarning("File Not Found", 
                                  "fruits.json not found. Please save a list first.")
    
    def open_browser(self):
        """Open the selected browser"""
        browser = self.browser_var.get()
        system = platform.system()
        
        try:
            if system == "Windows":
                if browser == "edge":
                    subprocess.Popen(["start", "msedge"], shell=True)
                elif browser == "chrome":
                    subprocess.Popen(["start", "chrome"], shell=True)
                elif browser == "firefox":
                    subprocess.Popen(["start", "firefox"], shell=True)
            elif system == "Darwin":  # macOS
                if browser == "edge":
                    subprocess.Popen(["open", "-a", "Microsoft Edge"])
                elif browser == "chrome":
                    subprocess.Popen(["open", "-a", "Google Chrome"])
                elif browser == "firefox":
                    subprocess.Popen(["open", "-a", "Firefox"])
            else:  # Linux
                if browser == "edge":
                    subprocess.Popen(["microsoft-edge"])
                elif browser == "chrome":
                    subprocess.Popen(["google-chrome"])
                elif browser == "firefox":
                    subprocess.Popen(["firefox"])
            
            time.sleep(3)  # Wait for browser to open
        except Exception as e:
            messagebox.showerror("Error", f"Failed to open browser: {str(e)}")
    
    def search_fruit(self, fruit: str):
        """Perform search for a single fruit"""
        try:
            # Open new tab (Ctrl+T)
            pyautogui.hotkey('ctrl', 't')
            time.sleep(1)
            
            # Type the fruit name in the address bar
            # The address bar should be focused after opening new tab
            pyautogui.typewrite(fruit, interval=0.1)
            time.sleep(0.5)
            
            # Press Enter to search
            pyautogui.press('enter')
            
            return True
        except Exception as e:
            print(f"Error searching for {fruit}: {str(e)}")
            return False
    
    def search_worker(self):
        """Worker thread for searching"""
        try:
            # Open browser first
            self.status_var.set("Opening browser...")
            self.open_browser()
            
            # Perform searches
            for i, fruit in enumerate(self.fruits):
                if not self.is_running:
                    break
                
                self.current_index = i
                
                # Update UI
                self.current_search_var.set(f"Searching for: {fruit}")
                self.status_var.set(f"Searching {i+1}/{len(self.fruits)}: {fruit}")
                
                # Update progress
                progress = ((i + 1) / len(self.fruits)) * 100
                self.progress_var.set(progress)
                
                # Search for the fruit
                if self.search_fruit(fruit):
                    # Wait before next search
                    if i < len(self.fruits) - 1:
                        time.sleep(self.delay)
                
                if not self.is_running:
                    break
            
            if self.is_running:
                self.status_var.set("All searches completed!")
                self.current_search_var.set("")
            else:
                self.status_var.set("Search stopped by user")
                
        except Exception as e:
            messagebox.showerror("Error", f"An error occurred: {str(e)}")
        finally:
            self.is_running = False
            self.start_btn.config(state=tk.NORMAL)
            self.stop_btn.config(state=tk.DISABLED)
    
    def start_searching(self):
        """Start the search process"""
        # Get fruits from text area
        fruits_text = self.fruit_text.get(1.0, tk.END).strip()
        if not fruits_text:
            messagebox.showwarning("No Fruits", "Please enter some fruits first!")
            return
        
        self.fruits = [f.strip() for f in fruits_text.split('\n') if f.strip()]
        self.delay = int(self.delay_var.get())
        
        # Confirmation dialog
        result = messagebox.askyesno("Start Automation", 
                                     f"This will:\n"
                                     f"1. Open {self.browser_var.get()} browser\n"
                                     f"2. Search for {len(self.fruits)} fruits\n"
                                     f"3. Wait {self.delay} seconds between searches\n\n"
                                     f"Move mouse to top-left corner to stop.\n"
                                     f"Continue?")
        
        if not result:
            return
        
        # Update UI
        self.is_running = True
        self.start_btn.config(state=tk.DISABLED)
        self.stop_btn.config(state=tk.NORMAL)
        self.progress_var.set(0)
        
        # Start worker thread
        search_thread = threading.Thread(target=self.search_worker, daemon=True)
        search_thread.start()
    
    def stop_searching(self):
        """Stop the search process"""
        self.is_running = False
        self.status_var.set("Stopping search...")
    
    def run(self):
        """Run the application"""
        self.root.mainloop()

# Additional standalone functions for command-line usage
def search_from_file(filename: str = "fruits.json", delay: int = 3, browser: str = "edge"):
    """
    Command-line function to search fruits from a JSON file
    
    Args:
        filename: Path to JSON file containing fruits
        delay: Seconds to wait between searches
        browser: Browser to use (edge, chrome, firefox)
    """
    try:
        # Load fruits from file
        with open(filename, 'r') as f:
            data = json.load(f)
            fruits = data.get('fruits', [])
        
        if not fruits:
            print("No fruits found in file!")
            return
        
        print(f"Found {len(fruits)} fruits to search")
        print(f"Using {browser} browser with {delay} second delay")
        print("Press Ctrl+C to stop at any time")
        
        # Open browser
        if platform.system() == "Windows":
            if browser == "edge":
                subprocess.Popen(["start", "msedge"], shell=True)
            elif browser == "chrome":
                subprocess.Popen(["start", "chrome"], shell=True)
        time.sleep(3)
        
        # Search each fruit
        for i, fruit in enumerate(fruits):
            print(f"Searching {i+1}/{len(fruits)}: {fruit}")
            
            # Open new tab and search
            pyautogui.hotkey('ctrl', 't')
            time.sleep(1)
            pyautogui.typewrite(fruit, interval=0.1)
            pyautogui.press('enter')
            
            if i < len(fruits) - 1:
                time.sleep(delay)
        
        print("All searches completed!")
        
    except KeyboardInterrupt:
        print("\nSearch stopped by user")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    # Run GUI application
    app = FruitSearchBot()
    app.run()