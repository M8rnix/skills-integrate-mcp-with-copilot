document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const rankingsList = document.getElementById("rankings-list");

  let allActivities = {};

  // Function to fetch and display rankings
  async function fetchRankings() {
    try {
      const response = await fetch("/rankings");
      const rankings = await response.json();
      
      if (rankings.length === 0) {
        rankingsList.innerHTML = "<p><em>No students have signed up yet</em></p>";
        return;
      }
      
      // Create rankings table
      let rankingsHTML = `
        <table class="rankings-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Student</th>
              <th>Points</th>
              <th>Activities</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      rankings.forEach((student, index) => {
        const rank = index + 1;
        const medalEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : "";
        rankingsHTML += `
          <tr class="${rank <= 3 ? 'top-rank' : ''}">
            <td class="rank-cell">${medalEmoji} ${rank}</td>
            <td class="email-cell">${student.email}</td>
            <td class="points-cell">${student.points}</td>
            <td class="activities-cell">${student.activity_count}</td>
          </tr>
        `;
      });
      
      rankingsHTML += `
          </tbody>
        </table>
      `;
      
      rankingsList.innerHTML = rankingsHTML;
    } catch (error) {
      rankingsList.innerHTML = "<p>Failed to load rankings. Please try again later.</p>";
      console.error("Error fetching rankings:", error);
    }
  }

  // Function to render activities (filtered)
  function renderActivities(filteredActivities) {
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = "";
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "-- Select an activity --";
    activitySelect.appendChild(defaultOption);

    Object.entries(filteredActivities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;

      activitiesList.appendChild(activityCard);

      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();
      renderActivities(allActivities);
      
      // Also refresh rankings when activities change
      fetchRankings();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Filter activities by search
  function filterActivitiesByName(searchValue) {
    const lowerSearch = searchValue.toLowerCase();
    const filtered = Object.fromEntries(
      Object.entries(allActivities).filter(([name]) =>
        name.toLowerCase().includes(lowerSearch)
      )
    );
    renderActivities(filtered);
  }

  // Event listener for search input
  const searchInput = document.getElementById("activity-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      filterActivitiesByName(e.target.value);
    });
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
