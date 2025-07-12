import argparse
import requests
import sys
import json
import time

# Configuration
API_BASE_URL = "http://localhost:3000"  #  backend URL

def submit_job(args):
    payload = {
        "org_id": args.org_id,
        "app_version_id": args.app_version_id,
        "test_path": args.test,
        "priority": args.priority,
        "target": args.target
    }

    try:
        response = requests.post(f"{API_BASE_URL}/jobs", json=payload)
        response.raise_for_status()
        print("Job submitted successfully.")
        print("Job ID:", response.json().get("job_id"))
    except requests.RequestException as e:
        print("Error submitting job:", e)
        sys.exit(1)

def check_status(args):
    job_id = args.job_id
    try:
        response = requests.get(f"{API_BASE_URL}/jobs/{job_id}")
        response.raise_for_status()
        job_status = response.json()
        print("Job Status:")
        print(json.dumps(job_status, indent=2))
    except requests.RequestException as e:
        print("Error checking job status:", e)
        sys.exit(1)

def poll_job(args):
    print(f"Polling job {args.job_id} until completion...")
    while True:
        try:
            response = requests.get(f"{API_BASE_URL}/jobs/{args.job_id}")
            response.raise_for_status()
            job = response.json()
            status = job.get("status")
            print(f"Current status: {status}")
            if status in ("completed", "failed"):
                print(f"Job finished with status: {status}")
                if status == "failed":
                    sys.exit(1)
                break
        except requests.RequestException as e:
            print("Error polling job:", e)
            sys.exit(1)
        time.sleep(3)

def main():
    parser = argparse.ArgumentParser(prog="qgjob", description="Qualgent Job CLI Tool")
    subparsers = parser.add_subparsers(title="commands", dest="command")

    # Submit command
    submit_parser = subparsers.add_parser("submit", help="Submit a new test job")
    submit_parser.add_argument("--org-id", required=True, help="Organization ID")
    submit_parser.add_argument("--app-version-id", required=True, help="App Version ID")
    submit_parser.add_argument("--test", required=True, help="Path to test file")
    submit_parser.add_argument("--priority", default="normal", help="Job priority")
    submit_parser.add_argument("--target", default="emulator", choices=["emulator", "device", "browserstack"], help="Test target")
    submit_parser.set_defaults(func=submit_job)

    # Status command
    status_parser = subparsers.add_parser("status", help="Check the status of a submitted job")
    status_parser.add_argument("--job-id", required=True, help="Job ID to check status for")
    status_parser.set_defaults(func=check_status)

    # Polling
    poll_parser = subparsers.add_parser("poll", help="Poll until job completion")
    poll_parser.add_argument("--job-id", required=True)
    poll_parser.set_defaults(func=poll_job)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    args.func(args)

if __name__ == "__main__":
    main()
