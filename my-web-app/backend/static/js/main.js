/*
  ========================================================================
  MAIN.JS - JavaScript for cPanel Static Website
  ========================================================================
  
  This file adds interactivity to the static HTML website.
  Functions are called directly from HTML elements using onclick and other attributes.
  
  ========================================================================
*/

// ========================================================================
// MOBILE MENU TOGGLE
// ========================================================================
// This function toggles the mobile navigation menu open/closed
// When the hamburger button is clicked on mobile devices

/**
 * toggleMenu()
 * Opens or closes the mobile navigation menu
 * Called by: The nav-toggle button in index.html:
 *   <button class="nav-toggle" onclick="toggleMenu()">
 */
function toggleMenu() {
    // document.querySelector() - Selects the first element matching CSS selector
    const navMenu = document.querySelector('.nav-menu');
    // classList.toggle() - Adds 'active' class if missing, removes if present
    navMenu.classList.toggle('active');
    
    // Select the hamburger button
    const navToggle = document.querySelector('.nav-toggle');
    // Toggle 'active' class on button for any styling changes
    navToggle.classList.toggle('active');
}


// ========================================================================
// FORM SUBMISSION HANDLER
// ========================================================================
// Handles the contact form submission
// Validates input and shows confirmation

/**
 * submitForm(event)
 * Handles contact form submission
 * @param {Event} event - The submit event from the form
 * Called by: The contact form in index.html:
 *   <form class="contact-form" onsubmit="submitForm(event)">
 */
function submitForm(event) {
    // event.preventDefault() - Stops page from reloading (default form behavior)
    event.preventDefault();
    
    // Get form reference from the event
    const form = event.target;
    
    // form.querySelector('#name') - Find input element with id="name"
    // .value - Get the text entered by user
    const name = form.querySelector('#name').value;
    const email = form.querySelector('#email').value;
    const message = form.querySelector('#message').value;
    
    // Validation: Check if any field is empty
    // Empty string is falsy in JavaScript, so we can use !field
    if (!name || !email || !message) {
        // alert() - Shows a popup message
        alert('Please fill in all fields');
        // return exits the function early
        return;
    }
    
    // Template literal for string interpolation
    // ${variable} - Inserts variable value into string
    alert(`Thank you ${name}! We received your message and will contact you at ${email} soon.`);
    
    // form.reset() - Clears all form fields
    form.reset();
}


// ========================================================================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ========================================================================
// Makes clicking #links scroll smoothly instead of jumping

/**
 * Anchor link smooth scroll
 * This code runs once when the page loads
 * It finds all links starting with # and adds smooth scrolling
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    // forEach() - Loop through each matching element
    // 'a[href^="#"]' - CSS selector: all anchor tags with href starting with #
    
    // addEventListener() - Add click event to element
    anchor.addEventListener('click', function(e) {
        // e.preventDefault() - Stop default jump behavior
        e.preventDefault();
        
        // this.getAttribute('href') - Get the href value (e.g., "#services")
        // document.querySelector() - Find element with that ID
        const target = document.querySelector(this.getAttribute('href'));
        
        // Check if target element exists (might be invalid ID)
        if (target) {
            // scrollIntoView() - Built-in smooth scroll to element
            // { behavior: 'smooth' } - Animate the scroll
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});


// ========================================================================
// HEADER SCROLL EFFECT
// ========================================================================
// Adds shadow to header when page is scrolled

/**
 * Scroll event listener
 * Listens for scroll events on the window
 */
window.addEventListener('scroll', () => {
    // window.scrollY - How many pixels have been scrolled vertically
    // If scrolled more than 50px
    if (window.scrollY > 50) {
        // Update the CSS box-shadow property
        // Darker shadow when scrolled down
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        // Original lighter shadow at top of page
        header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.08)';
    }
});


// ========================================================================
// PAGE INITIALIZATION
// ========================================================================
// Code that runs when the page is fully loaded

/**
 * DOMContentLoaded event
 * Fires when HTML is parsed but before images load
 * Safe place to run initializations
 */
document.addEventListener('DOMContentLoaded', () => {
    // console.log() - Write to browser's developer console
    // Useful for debugging
    console.log('Website loaded and ready!');
});

/*
 ========================================================================
 OPTIONAL FEATURES (Uncomment to enable)
 ========================================================================

// Add to cart functionality:
// let cart = [];
// function addToCart(product) {
//     cart.push(product);
//     updateCartCount();
// }
// function updateCartCount() {
//     document.querySelector('.cart-count').textContent = cart.length;
// }

// Mobile detection:
// function isMobile() {
//     return window.innerWidth <= 768;
// }

// Scroll to top button:
// window.scrollTo({ top: 0, behavior: 'smooth' });

// Counter animation:
// function animateCounter(element, target) {
//     let current = 0;
//     const increment = target / 50;
//     const timer = setInterval(() => {
//         current += increment;
//         if (current >= target) {
//             clearInterval(timer);
//         }
//         element.textContent = Math.floor(current);
//     }, 20);
// }

// Parallax effect:
// window.addEventListener('scroll', () => {
//     const scrolled = window.pageYOffset;
//     document.querySelector('.hero').style.backgroundPositionY = scrolled * 0.5 + 'px';
// });
*/