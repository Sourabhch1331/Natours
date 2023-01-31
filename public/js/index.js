import '@babel/polyfill';
import { login,logout } from './login'
import { updateData } from './updateSettings'
import { bookTour } from './stripe'

const loginForm=document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const passwordDataForm = document.querySelector('.form-user-settings');
const bookBtn = document.getElementById('book-tour');


if(passwordDataForm){
    passwordDataForm.addEventListener('submit',async (e)=>{
        e.preventDefault();
        console.log('loggedin');
        document.querySelector('.btn--save-password').textContent='Updating...';
        const password = document.getElementById('password-current').value;
        const newPassword = document.getElementById('password').value;
        const newPasswordConfirm = document.getElementById('password-confirm').value;
        
        await updateData({
            password,
            newPassword,
            newPasswordConfirm
        },'password');
        document.querySelector('.btn--save-password').textContent='Save password';
        document.getElementById('password-current').value='';
        document.getElementById('password').value='';
        document.getElementById('password-confirm').value='';
    });
}

if(userDataForm){
    
    userDataForm.addEventListener('submit',(e)=>{
      
        e.preventDefault();

        const form = new FormData();
        const email = document.getElementById('email').value;
        const name = document.getElementById('name').value;
        const photo = document.getElementById('photo').files[0];
        
        form.append('name',name)
        form.append('email',email)
        form.append('photo',photo)

        updateData(form,'data');
    })
}

if(loginForm){
    loginForm.addEventListener('submit', (e)=>{
        e.preventDefault();
        e.target.textContent ='LOGING IN...'
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
    
        login(email,password);
        e.target.textContent ='LOG IN'
        return false;
    });
}


if(logOutBtn) logOutBtn.addEventListener('click', logout);

if(bookBtn){
    bookBtn.addEventListener('click',e => {
        // e.target.textContent ='Processing...'
        const {tourId} = e.target.dataset;
        // bookTour(tourId)
        // e.target.textContent ='Book tour Now!'
    });
}

