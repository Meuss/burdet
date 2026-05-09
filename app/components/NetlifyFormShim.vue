<template>
    <form name="rsvp" netlify netlify-honeypot="website" hidden aria-hidden="true">
        <input type="text" name="fullName" />
        <input type="text" name="plusOne" />
        <input type="number" name="peopleCount" />
        <input type="text" name="address" />
        <input type="text" name="npa" />
        <input type="text" name="locality" />
        <input type="email" name="email" />
        <input type="number" name="childrenCount" />
        <textarea name="dietary"></textarea>
        <input type="text" name="ownVehicle" />
        <textarea name="message"></textarea>
        <input type="text" name="website" />
    </form>
    <form name="decline" netlify netlify-honeypot="website" hidden aria-hidden="true">
        <input type="text" name="fullName" />
        <textarea name="message"></textarea>
        <input type="text" name="website" />
    </form>
</template>
