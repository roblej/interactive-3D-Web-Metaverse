export function onMouseMove(event, appInstance) {
    event.preventDefault();

    // 마우스 위치를 정규화된 장치 좌표로 변환
    appInstance._mouse.x = (event.clientX / appInstance._divContainer.clientWidth) * 2 - 1;
    appInstance._mouse.y = -(event.clientY / appInstance._divContainer.clientHeight) * 2 + 1;

    // Raycaster 업데이트
    appInstance._raycaster.setFromCamera(appInstance._mouse, appInstance._camera);

    // 교차하는 객체 찾기
    const intersects = appInstance._raycaster.intersectObjects(appInstance._scene.children);

    if (intersects.length > 0) {
        const intersected = intersects[0].object;
        if (intersected.name === "clickableBox") {
            if (appInstance._highlighted !== intersected) {
                // 이전에 강조된 객체가 있으면 원래 색상으로 되돌림
                if (appInstance._highlighted) {
                    appInstance._highlighted.material.color.set(appInstance._originalColor);
                }
                // 새로운 객체 강조
                appInstance._originalColor.copy(intersected.material.color); // 원래 색상 저장
                intersected.material.color.set(0xff0000); // 강조 색상으로 변경
                appInstance._highlighted = intersected; // 현재 강조된 객체 업데이트
            }
        } else if (appInstance._highlighted) {
            // 마우스가 다른 객체로 이동했을 때 원래 색상으로 되돌림
            appInstance._highlighted.material.color.set(appInstance._originalColor);
            appInstance._highlighted = null;
        }
    } else if (appInstance._highlighted) {
        // 마우스가 모든 객체에서 벗어났을 때 원래 색상으로 되돌림
        appInstance._highlighted.material.color.set(appInstance._originalColor);
        appInstance._highlighted = null;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const option1Button = document.getElementById('option1');
    
    option1Button.addEventListener('click', () => {
        fetch('http://127.0.0.1:3000/api/hello')
            .then(response => response.json())
            .then(data => console.log(data))
            .catch(error => console.error('Error:', error));
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const option1Button = document.getElementById('option2');
    
    option1Button.addEventListener('click', () => {
        const requestOptions = {
            method: 'POST', // 메소드 타입
            headers: {
                'Content-Type': 'application/json', // 컨텐츠 타입
            },
            body: JSON.stringify({
                id: sessionStorage.getItem('userId'), // 서버로 보낼 데이터
                score : 10
            }),
        };
        
        // fetch 함수를 사용하여 POST 요청 보내기
        fetch('http://127.0.0.1:3000/api/hello', requestOptions)
            .then(response => response.json())
            .then(data => console.log(data)) // 응답 데이터 처리
            .catch(error => console.error('Error:', error)); // 에러 처리
    });
});

// 모달 요소
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const closeButtons = document.querySelectorAll('.modal .close');

// 페이지 로드 시 로그인 모달 표시
document.addEventListener('DOMContentLoaded', function() {
    loginModal.style.display = 'block';
});

// 모달 닫기 버튼 처리
closeButtons.forEach(button => {
    button.addEventListener('click', function() {
        this.parentElement.parentElement.style.display = 'none';
    });
});

// 로그인 폼과 회원가입 폼 전환 함수
window.switchToSignup = function() {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
}

window.switchToLogin = function() {
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
}


// 로그인 및 회원가입 처리 함수 (예시)
loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const id = loginForm.id.value;
    const password = loginForm.password.value;
    console.log('로그인 시도:', id, password);
    // 로그인 로직 구현 필요
    sessionStorage.setItem('userId', id); // 세션에 사용자 아이디 저장
    console.log(sessionStorage)
});

signupForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const id = signupForm.id.value;
    const password = signupForm.password.value;
    const confirmPassword = signupForm.confirmPassword.value;
    const age = signupForm.age.value;
    if (password === confirmPassword) {
        console.log('회원가입 시도:', id, password, age);
        // 회원가입 로직 구현 필요
    } else {
        console.log('비밀번호가 일치하지 않습니다.');
    }
});
