# for i in range(1,21):
#     if i % 3 == 0 and i % 5 == 0:
#         print("FizzBuzz")
#     elif i%3==0:
#         print("Fizz")
#     elif i%5==0:
#         print("Buzz")
#     else:
#         print(i)


# time_str="09:45"
# hours,minutes=map(int,time_str.split(":"))

# if hours<12:
#     print("Morning")
# if hours>12 and hours<=18:
#     print("afternoon")
# if hours>18 or (hours==18 and minutes>0):
#     print("Evening")

# nums = [1, 2, 3, 4]
# result=[]
# for i in nums:
#     result.append(i * 2)
# nums+=result




# names = ["Idan", "Yael", "Idan", "Noam", "Yael"]
# results={}
# for i in names:
#     results[i]=results.get(i,0)+1
# print(results)


# users = [
#     {"name": "Idan", "age": 25},
#     {"name": "Yael", "age": 17},
#     {"name": "Noam", "age": 30}
# ]

# for i in users:
#     if i["age"]>18:
#         print(i["name"])

# newList = [user["name"] for user in users if user["age"]>18]       
# print(newList)


# def newDict(name, time)-> dict:
#     return {"name":name,"time":time}

# print(f"{newDict("idan","00:00")}")


# def improvedNewDict(name, time)-> dict:
#     try:
#         hours,minutes= map(int,time.split(":"))
#         if hours<0 or hours>23 or minutes<0 or minutes>59:
#             return None
#         return {"name":name,"time":time}
#     except:
#         print("entered here")
#         return None
# 5
# improvedNewDict("name", "16:00")

# def add_appointment(appt, appointments=None):
#     appointments.append(appt)
#     return appointments


# def incAge(age) -> int| None:
#     try:
#         return int(age)+1
#     except :
#         print("Error: not a String or failed to convert to integer")
#         return None

# incAge("y")




# appointments=[]
# def book_appointment(name,time):
#     for appt in appointments:
#         if appt["time"]==time:
#             return False
#     appointments.append({"name":name,"time":time})
#     return True

# book_appointment("Shmulik","09:00")
# book_appointment("idan","09:00")
# book_appointment("idan","09:01")

# print(appointments)

 

# appointments=[]

# def parse_time(t:str):
#     try:
#         h,m=map(int,t.split(":"))
#         if 0<= h<=23 and 0<=m <=59:
#             return h,m
#         return None
#     except ValueError:
#         return None
    

# def book(name,time)-> bool:
#     if parse_time(time) in None:
#         return False
    
#     for appt in appointments:
#         if appt["time"]== time:
#             return False
#     appointments.append({"name":name,"time":time})
#     return True

# def cancel(name,time)->bool:
#     for i in appointments:
#         if i["name"]==name and i["time"]==time:
#             appointments.remove(i)
#             return True
#     return False

# def list_after(time)-> list[str]:
#     t=parse_time(time)
#     if t is None:
#         return []
#     h,m=t

#     names=[]
#     for i in appointments:
#         aH,aM= map(int,i["time"].split(":"))
#         if aH>h or (aH==h and aM> m):
#             names.append(i["name"])
#     return names


# def count_by_time(appointments):
#     counts={}
#     for appt in appointments:
#         t= appt.get("time")
#         if t is None:
#             continue
#         counts[t]=counts.get(t,0)+1
#     return my_dict



# def parse_time(time)->bool:
#     try:
#         h,m=map(int,time.split(":"))
#         if 0<= h <=23 and 0<= m <=59:
#             return h*60+m
#         return None
#     except ValueError:
#         return None
    
# def book(appointments, name,start,duration):
#     if has_conflict(appointments, start , duration):
#         return False
#     appointments.append({"name":name,"time":start,"duration":duration})
#     return True
    
# def has_conflict(appointments, start, duration)->bool:
#     if duration<=0:
#         return True
#     t=parse_time(start)
#     if t is None:
#         return True
#     start_min=t
#     end_min=start_min+duration

#     for appt in appointments:
#         a_start=parse_time(appt["start"])
#         if a_start is None:
#             continue
#         a_end=a_start+appt["duration"]
#         if start_min<a_end and a_start<end_min:
#             return True
#     return False
        

########################DAY 2###################################
# appointments = [
#     {"name": "Idan", "start": "09:30", "duration": 60},   # 09:30–10:30
#     {"name": "Yael", "start": "11:00", "duration": 30},   # 11:00–11:30
#     {"name": "Noam", "start": "13:00", "duration": 90},   # 13:00–14:30
# ]

# def parse_time(t)->int|None:
#     try:
#         h,m=map(int,t.split(":"))
#         if 0<=h<=23 and 0<=m<=59:
#             return h*60+m
#         return None
#     except ValueError:
#         return None

# def can_book(appointments,start,duration)->bool:
#     ds=parse_time(start)
#     if ds is None:
#         return False
#     de=ds+duration
#     if ds<9*60 or de> 17*60:
#         return False
#     free=free_slots(appointments)
#     if not free:
#         return True
    
#     for s,e in free:
#         # st=parse_time(s)
#         # end=parse_time(e)
#         st=s
#         end=e
#         if st is None or end is None:
#             continue
#         if ds>=st and de<=end:
#             return True
#     return False

# def book(appointments, name,start,duration)-> bool:
#     if can_book(appointments, start, duration):
#         appointments.append({"name":name, "start":start,"duration":duration})
#         return True
#     return False

# def free_slots(appointments, day_start="09:00",day_end="17:00")-> list[tuple[str,str]]:
#     ds=parse_time(day_start)
#     de=parse_time(day_end)
#     if ds is None or de is None:
#         return []
    
#     my_appt=[]
#     for appt in appointments:
#         m=parse_time(appt["start"])
#         if m is None:
#             return []
#         my_appt.append((m,m+appt["duration"]))
    
#     my_appt.sort(key=lambda x: x[0])

#     merged=[]
#     for s,e in my_appt:
#         if not merged or merged[-1][1]<s:
#             merged.append([s,e])
#         else:
#             merged[-1][1]=max(merged[-1][1],e)
    
#     free=[]
#     current=ds
#     for s,e in merged:
#         if e<=ds or s>=de:
#             continue
#         s=max(s,ds)
#         e=min(e,de)

#         free.append((current,s))
#         if current<s:
#             current=max(current,e)

#     if current< de:
#         free.append((current,de))
#     print(free)
#     return free

# book(appointments, "someone","16:00",30)
# print(appointments)



appointments = [
    {"provider_id": 1, "name": "B", "start": "11:00", "duration": 30},
    {"provider_id": 1, "name": "A", "start": "09:30", "duration": 60},  # 09:30-10:30
    {"provider_id": 2, "name": "C", "start": "10:00", "duration": 60},  # provider אחר
]

def parse_time(t)-> int|None:
    try:    
        h,m=map(int,t.split(":"))
        if 0<=h<=23 and 0<=m<=59:
            return h*60+m
        return None
    except ValueError:
        return None
def to_hhmm(minutes)->str:
    h=minutes//60
    m=minutes%60
    return f"{h:02d}:{m:02d}"

def filter_by_provider(appointments, provider_id)-> list:
    return [ appt for appt in appointments if appt["provider_id"]==provider_id]


def book(appointments, provider_id,name,start,duration)->bool:
    if can_book(appointments,provider_id,start,duration):
        appointments.append({"provider_id":provider_id,"name":name,"start":start,"duration":duration})
        return True
    return False



def can_book (appointments,provider_id, start,duration)-> bool:
    s=parse_time(start)
    if s is None:
        return False
    e=s+duration

    free=free_slots(appointments,provider_id)
    if not free:
        return False
    
    for st,en in free:
        st=parse_time(st)
        en=parse_time(en)
        if overlaps(s,e,st,en):
            return True
    
    return False
def overlaps(s,e,st,en)-> bool:
    return (st>=s and e<=en)

def free_slots(appointments,provider_id,day_start="09:00",day_end="17:00")-> list[tuple[str,str]]:
    ds=parse_time(day_start)
    de=parse_time(day_end)
    if ds is None or de is None:
        return []

    appts=filter_by_provider(appointments, provider_id)
    busy=[]
    for appt in appts:
        start=parse_time(appt["start"])
        if start is None:
            return []
        end=start+appt["duration"]
        if start>de or end<ds:
            continue
        busy.append((start,end))
    busy.sort(key=lambda x: x[0])

    merge=[]
    for s,e in busy:
        if not merge or merge[-1][1]<s:
            merge.append([s,e])
        else:
            merge[-1][1]=max(merge[-1][1],e)

    free=[]
    current=ds
    for s,e in merge:
        s=max(ds,s)
        e=min(de,e)
        if current < s:
            free.append((to_hhmm(current),to_hhmm(s)))
        current=max(current,e)
    if current < de:
        free.append((to_hhmm(current),to_hhmm(de)))
    return free

# book(appointments,1,"somone","09:00",30)
class Customer:
    def __init__(self,id,name,priority,required_skill):
        self.id=id
        self.name=name
        self.priority=priority
        self.required_skill=required_skill

class Agent:
    def __init__(self, id, name, is_available,skills):
        self.id=id
        self.name=name
        self.is_available=is_available
        self.skills=skills
    

class QueueSystem:
    def __init__(self):
        self.customers_queue=[]
        self.agents=[]
        self.active_assignments=[]

    def add_agent(self, agent):
        self.agents.append(agent)
    
    def add_customer_to_queue(self,customer):
        self.customers_queue.append(customer)
        self.customers_queue.sort(key=lambda c:c.priority)

    def get_queue_status(self):
        customer_dict={}
        
        for c in self.customers_queue:
            pr=c.priority
            customer_dict[pr]=customer_dict.get(pr,0)+1

        return customer_dict
    
    # def set_agent_status(self,agent_id, is_available):
    #     for agent in self.agents:
    #         if agent.id== agent_id:
    #             agent.is_available=is_available
    # def get_average_wait_time():

    def get_agent_with_skill(self, skill):
        return [agent for agent in self.agents if skill in agent.skills ]

    def assign_customer_to_agent(self):
        if not self.customers_queue:
            return None
        
        customer=self.customers_queue[0]

        agents= self.get_agent_with_skill(customer.required_skill)
        if not agents:
            return None
        for agent in agents:
            if agent.is_available:
                agent.is_available=False
                self.customers_queue.pop()
                assignments={
                    "customer": customer.id,
                    "agent":agent.id,
                    "skill": customer.required_skill
                }
                self.active_assignments.append(assignments)
                return self.active_assignments

        return None    
                
                

# qs= QueueSystem()

# # הוספת נציגים
# qs.add_agent(Agent(1, "Alice", True, ["billing", "technical"]))
# qs.add_agent(Agent(2, "Bob", True, ["support"]))

# # הוספת לקוחות
# qs.add_customer_to_queue(Customer(101, "John", 2, "billing"))
# qs.add_customer_to_queue(Customer(102, "Jane", 1, "technical"))

# # הקצאה
# result = qs.assign_customer_to_agent()
# print(result)  # {'customer': 'Jane', 'agent': 'Alice'}
# # Jane עם priority=1 עברה לפני John!




########################PART 2##############################
class Product:
    def __init__(self,id,name,quantity,min_quantity):
        self.id=id
        self.name=name
        self.quantity=quantity
        self.min_quantity=min_quantity

class Warehouse:
    def __init__(self):
        self.products=[]
    def add_product(self,product):
        if not product:
            return None
        self.products.append(product)
    
    def get_product(self, product_id):
        for prod in self.products:
            if prod.id==product_id:
                return prod
        return None
    
    def remove_stock(self,product_id,quantity)->bool:
        prod=self.get_product(product_id)
        if prod.quantity<quantity:
            return False
        prod.quantity-=quantity
        if prod.quantity<prod.min_quantity:
            print(f"Warning!- you're under Minimum quantity for this product: {prod.name}")
        return True
    
    def add_stock(self,product_id,quantity):
        
        for prod in self.products:
            if prod.id==product_id:
                prod.quantity+=quantity
                return True
        return None
    
    def get_low_stock_products(self):
        return [prod for prod in self.products if prod.quantity < prod.min_quantity ]
    
    def get_total_value(self, product_id, price_per_unit):
        for prod in self.products:
            if prod.id==product_id:
                return prod.quantity*price_per_unit
            


# warehouse = Warehouse()

# # הוספת מוצרים
# warehouse.add_product(Product(1, "Laptop", 50, 10))
# warehouse.add_product(Product(2, "Mouse", 5, 20))
# warehouse.add_product(Product(3, "Keyboard", 15, 10))

# # הורדת מלאי
# warehouse.remove_stock(1, 5)  # True
# warehouse.remove_stock(2, 10)  # False - אין מספיק

# # הוספת מלאי
# warehouse.add_stock(2, 30)  # עכשיו יש 35

# # בדיקת מלאי נמוך
# low_stock = warehouse.get_low_stock_products()
# print(low_stock)  # אמור להחזיר Mouse כי 5 < 20

# # חישוב ערך
# value = warehouse.get_total_value(1, 1000)  # 45 * 1000 = 45000
# print(value)

###################################PART 3##########################################


class TimeRange:
    def __init__(self,start:str,duration:int):
        self.start_minutes=self.parse_time(start)

        if self.start_minutes is None:
            raise ValueError("Invalid start time")
        
        if duration <=0:
            raise ValueError("Duration must be positive")
        
        self.end_minutes=self.start_minutes+duration
        if self.end_minutes >24*60:
            raise ValueError("TimeRange cross midnight")
    @staticmethod
    def parse_time(t):
        try:
            h,m=map(int,t.split(":"))
            if 0<=h<=23 and 0<=m<=59:
                return h*60+m
            return None
        except ValueError:
            return None
        
    
    def overlaps(self,other):
        return self.start_minutes<other.end_minutes and other.start_minutes<self.end_minutes
    
    def __str__(self):
       return f"{self.to_hhmm(self.start_minutes)}-{self.to_hhmm(self.end_minutes)}"
    
    @staticmethod
    def to_hhmm(time):
        h=time//60
        m=time%60
        return f"{h:02d}:{m:02d}"
    
    @classmethod
    def from_minutes(cls,start,end):
        duration = end-start
        if duration<=0:
            raise ValueError("duration must be positive")
        start_str=cls.to_hhmm(start)

        return cls(start_str,duration)
            

class Appointment:
    def __init__(self, provider_id, client_name, time_range:TimeRange):
        self.provider_id=provider_id
        self.client_name=client_name
        self.time_range=time_range
    
    def overlaps(self,other)->bool:
        if self.provider_id != other.provider_id:
            return False
        return self.time_range.overlaps(other.time_range)



class Scheduler():
    def __init__(self):
        self.appointments : list[Appointment]=[]
    
    def get_provider_by_id(self,provider_id):
        return [appt for appt in self.appointments if appt.provider_id==provider_id]


    def book(self,provider_id, client_name,start,duration)->bool:
        appts=self.get_provider_by_id(provider_id)
        try:
            tr=TimeRange(start,duration)
        except ValueError:
            return False
        
        new_appt=Appointment(provider_id,client_name,tr)

        for appt in appts:
            if appt.overlaps(new_appt):
                return False
        self.appointments.append(new_appt)
        return True
        

    def cancel(self, provider_id,client_name,start)->bool:
        pass
    def list(self,provider_id=None)->list[Appointment]:
        pass

    def free_slots(self,provider_id,day_start="09:00",day_end="17:00"):
        appts= self.get_provider_by_id(provider_id)
        appts.sort(key=lambda x:x.time_range.start_minutes)
        ds=TimeRange.parse_time(day_start)
        de=TimeRange.parse_time(day_end)
        free=[]
        current=ds

        for appt in appts:
            s=max(appt.time_range.start_minutes,ds)
            e=min(appt.time_range.end_minutes,de)
            if current<s:
                free.append(TimeRange.from_minutes(current,s))
            current=max(current,e)
        if current<de:
            free.append(TimeRange.from_minutes(current,de))

        return free
    













class ParkingVehicle:
    def __init__(self,capacity):
        self.parking={}
        self.available_parking=set(range(capacity))
    
    def addCar(self,car_num)->bool:
        if len(self.available_parking)==0:
            return False
        parking_number=self.available_parking.pop()
        self.parking[car_num]=parking_number
        return True
    
    def removeCar(self,car_num)->bool:
        cn=self.parking.get(car_num)
        if not cn:
            return False
        self.available_parking.add(cn)
        self.parking.pop(car_num)
        return True
    
    def get_available(self)->int:
        return len(self.available_parking)

    # def get_car_spot(self,car_num):
    #     return self.

class ParkingSystem:
    def __init__(self,floor_max_cap,floor_amount):
        self.floors=[]
        for i in range(floor_amount):
            floor=ParkingVehicle(floor_max_cap)
            self.floors.append(floor)

    def find_car(self,car_num):
        counter=0
        for i in self.floors:
            spot=i.parking.get(car_num)
            if spot is not None:
                return {
                    "car number": car_num,
                    "floor": counter,
                    "spot": spot,
                }
            counter+=1
        return None
    
    def add_car(self,car_num)->bool:
        for floor in self.floors:
            if floor.get_available()>0:
                return floor.get(car_num)
        return False







#######################DAY 4#################################

class Task:
    def __init__(self,title,description,priority):
        self.title=title
        self.description=description
        self.state="ToDo"
        self.priority=priority

    def setPriority(self,priority):
      self.priority=priority

    def setState(self,state):
        self.state=state
    def __str__(self):
        return f"('{self.title}', {self.priority}, {self.state})"
    
    def __repr__(self):
        return self.__str__()


class ManagementSystem:
    def __init__(self):
        self.tasks=[]

    def add_task(self,task)->bool:
        if task is None:
            return False
        self.tasks.append(task)
        return True
        

    def change_state(self,task:Task,state)->bool:
        for t in self.tasks:
            if t is task:
                t.setState(state)
                return True
        return False
    
    def change_priority(self,task,priority)->bool:
        for t in self.tasks:
            if t is task:
                t.setPriority(priority)
                return True
        return False
    def list_by_state(self)->dict|None:
        state_dict={}
        for task in self.tasks:
            state=task.state
            state_dict.setdefault(state,[]).append(task)
        return state_dict
    

    def list_by_priority(self)->dict|None:
        priority_dict={}
        for task in self.tasks:
            priority=task.priority
            priority_dict.setdefault(priority,[]).append(task)
        return priority_dict
    


# mg=ManagementSystem()

# t1=Task("somthing0","hello0","Low")
# t2=Task("somthing1","hello1","Medium")
# t3=Task("somthing2","hello2","Medium")
# t4=Task("somthing3","hello3","High")

# mg.add_task(t1)
# mg.add_task(t2)
# mg.add_task(t3)
# mg.add_task(t4)

# mg.change_priority(t4,"Medium")

# p=mg.list_by_priority()
# print(p)


# ms = ManagementSystem()

# task1 = Task("Buy milk", "Go to store", "High")
# task2 = Task("Clean room", "Vacuum and dust", "Low")
# task3 = Task("Code review", "Review PR #123", "High")

# ms.add_task(task1)
# ms.add_task(task2)
# ms.add_task(task3)

# ms.change_state(task1, "InProgress")
# ms.change_state(task3, "Done")

# print(ms.list_by_state())
# print(ms.list_by_priority())





class BankAccount:
    def __init__(self,id,name,balance):
        self.id=id
        self.name=name
        self.balance=balance

    def deposit(self,amount)->bool:
        if amount<=0:
            return False
        self.balance+=amount
        return True
        
    def withdraw(self,amount)->bool:
        if self.balance-amount<0:
            return False
        self.balance-=amount
        return True
    
    def showBalace(self)->int:
        return self.balanace

class Bank:
    def __init__(self):
        self.accounts={}
    
    def add_account(self,account)->bool:
        if account.balance<0:
            return False
        if self.accounts.get(account.id) is not None :
            return False
        self.accounts[account.id]=account
        return True
    def get_account_balance(self,id):
        account=self.accounts.get(id)
        if account is None:
            return None
        return account.balance
    
    def show_all_accounts(self):
        return self.accounts

    def transfer_money(self,from_account,to_account,amount)->bool:
        try:
            a=self.accounts.get(from_account.id)
            b=self.accounts.get(to_account.id)
            if a is None or b is None or a==b:
                raise TypeError
            if amount <=0 or a.balance-amount<0:
                raise ValueError
            a.withdraw(amount)
            b.deposit(amount)
            return True
        except ValueError:
            print("the value must be positive.")
            return False
        except TypeError:
            print("one or 2 of the accounts is not exists in the Bank System")
            return False
        

# b=Bank()

# a1=BankAccount(1,"idan",700)
# a2=BankAccount(2,"shlomi",200)
# a3=BankAccount(3,"yael",1500)
# a4=BankAccount(4,"yael",1500)


# b.add_account(a1)
# b.add_account(a2)
# b.add_account(a3)
# print(b.get_account_balance(1))
# print(b.show_all_accounts())
# b.transfer_money(a2,a3,400)
# print(b.get_account_balance(1))
# print(b.get_account_balance(2))








class User:
    def __init__(self,name,email):
        self.name=name
        self.email=email

    
class Event:
    def __init__(self,event_name,max_capacity):
        self.event_name=event_name
        self.max_capacity=max_capacity
        self.event_attendees=[]
        self.event_waitlist=[]
    
    def register(self,name,email)->bool:
        if self.checkIfExist_attendees(email):
            print("the user is already in the event list")
            return False
        if len(self.event_attendees)>=self.max_capacity:
            if self.checkIfExist_wating(email):
                print("the user is already in the wating list")
                return False
            
            self.event_waitlist.append(User(name,email))
            print("the event is full added to Waiting list!")
            return False
        
        self.event_attendees.append(User(name,email))
        print("added successfully to the event attendees!")
        return True

    def cancel(self,email) -> bool:
        if self.checkIfExist_attendees(email):
            for user in self.get_attendees():
                if user.email==email:
                    self.event_attendees.remove(user)
                    if self.capacity<self.max_capacity and len(self.event_waitlist)>0:
                        self.event_attendees.append(self.event_waitlist.pop(0))
                    return True

        
        if self.checkIfExist_wating(email):
            for user in self.get_waitlist():
                if user.email==email:
                    self.event_waitlist.remove(user)
                    return True
        return False
    
    def checkIfExist_attendees(self,email)->bool:
        for user in self.event_attendees:
            if email == user.email:
                return True
        return False

    def checkIfExist_wating(self,email)->bool:
        for user in self.event_waitlist:
            if email in user.email:
                return True
        return False
    
    def get_waitlist(self):
        return self.event_waitlist  
    
    def get_attendees(self):
        return self.event_attendees
    
    def get_position_in_waitinglist(self,email)->int:
        if self.checkIfExist_wating(email):
            for idx in range(len(self.event_waitlist)):
                if self.event_waitlist[idx].email==email:
                    return idx
        return None
    




    ####################DAY 4###########################################


class Book:

    def __init__(self, title, author, isbn):
        self.title=title
        self.author=author
        self.isbn=isbn
        self.available=True

class Member:
    def __init__(self,member_id,name):
        self.member_id=member_id
        self.name=name
        self.books=[]


class Library:
    def __init__(self):
        self.books=[]
        self.members={}

    def add_book(self,book: Book):
        self.books.append(book)
    
    def register_member(self,member:Member):
        self.members[member.member_id]=member

    def borrow_book(self,member_id,isbn)->bool:
        for book in self.books:
            if book.isbn ==isbn:
                if not book.available:
                    print("book is not available")
                    return False
                member=self.members.get(member_id)
                if len(member.books)<3:
                    member.books.append(book)
                    print("borrowed successfully")
                    book.available=False
                    return True
                return False
        return False
    def get_available_books(self):
        return [book for book in self.books if book.available==True]
    
    def get_borrowed_books(self,member_id):
        member=self.members.get(member_id)
        return member.books
    
    def return_book(self,member_id,isbn)->bool:
        book_to_return=None
        member=self.members.get(member_id)
        for book in member.books:
            if book.isbn==isbn:
                book_to_return=book
                break

        if book_to_return is None:
            return False
        member.books.remove(book)
        book_to_return.available=True
        return True






class Doctor:
    def __init__(self,name,speciality):
        self.name=name
        self.speciality=speciality
        self.available_slots=[]
        
class Patient:
    def __init__(self,id,name):
        self.id=id
        self.name=name
        self.appointments=[]
    
class Appointment:
    def __init__(self,doctor_name,patient_name,date_time,status):
        self.doctor_name=doctor_name
        self.patient_name=patient_name
        self.date_time=date_time
        self.status=status

    @staticmethod
    def time_to_minutes(self,time):
        try:
            h,m=map(int,time.split(":"))
            if 0<=h<=23 or 0<=m<=59:
                return h*60+m
            return None
        except ValueError:
            print("Value error")
            return None
        

class Clinic:
    def __init__(self):
        self.doctors=[]
        self.patients=[]
        self.appointments=[]
    
    def time_to_minutes(self,time):
        try:
            h,m=map(int,time.split(":"))
            if 0<=h<=23 or 0<=m<=59:
                return h*60+m
            return None
        except ValueError:
            print("Value error")
            return None
        
    def add_doctor(self,doctor:Doctor)->bool:
        if doctor is None:
            print("there is no info about the doctor")
            return False
        if doctor in self.doctors :
            print(f"this doctor {doctor.name} is already in this clinc")
            return False
        self.doctors.append(doctor)
        print(f"Doctor: {doctor.name} has joined successfully to the clinic!")
        return True

    def register_patient(self,patient)->bool:
        if patient is None:
            print("there is no info about the patient")
            return False
        if patient in self.patients :
            print(f"this patient {patient.name} is already in this clinc")
            return False
        self.patients.append(patient)
        print(f"patient: {patient.name} has joined successfully to the clinic!")
        return True
    
    def book_appointment(self,patient_id,doctor_name,date_time):
        
        pass







class Payment:
    def __init__(self,amount):
        self.amount=amount

    # def checkout(self,payment_method,amount):

    #     pass
    def process_payment(self):
        return 0
    def get_fee(self):
        return 0

class CreditCard(Payment):
    def process_payment(self):
        fee=self.get_fee()
        return f"the Total price with credit card is : {self.amount+fee}"
        
    def get_fee(self):
        return self.amount*0.025
    


class PayPal(Payment):
    def process_payment(self):
        fee=self.get_fee()
        return f"the Total price with paypal is: {self.amount+fee}"
        
    def get_fee(self,):
        return self.amount*0.03

class BankTransfer(Payment):

    def process_payment(self):
        fee=self.get_fee()
        return f"the Total price with cash is: {self.amount+fee}"
        
    def get_fee(self):
        return 0
    
def checkout(payment):
    return payment.process_payment()

# print(checkout(BankTransfer(10530)))
# print(checkout(PayPal(10340)))
# print(checkout(CreditCard(10210)))

5



class Result:
    def twoSum(self,nums:list,target)->list:
        my_map={}
        for i,n in enumerate(nums):
            diff=target-n
            if diff in my_map:
                return [my_map[diff],i]
            my_map[n]=i

























########  Home Project  ##########

from enum import Enum
import heapq
from datetime import datetime
import time

#####ENUM#########
class ResourceType(Enum):
    DOCTOR=1
    NURSE=2
    XRAY=3

class Resource:  
    def __init__(self,id,resource_type):
        self.id=id
        self.resource_type=resource_type
        self.is_available=True
        self.current_patient=None
    
    def assign_patient(self,patient):
        self.current_patient=patient
        self.is_available=False
    
    def release(self):
        self.current_patient=None
        self.is_available=True

class Doctor(Resource):
    def __init__(self,id,name):
        super().__init__(id,ResourceType.DOCTOR)
        self.name=name

class Nurse(Resource):
    def __init__(self,id,name):
        super().__init__(id,ResourceType.NURSE)
        self.name=name

class XRay(Resource):
    def __init__(self,id):
        super().__init__(id,ResourceType.XRAY)



class Patient:

    _id_counter = 1

    def __init__(self,name,urgency,required_resource,downgradable=False):
        self.id=Patient._id_counter
        Patient._id_counter+=1

        self.name=name
        self.urgency=urgency
        self.required_resource=required_resource
        self.downgradeable=downgradable

        self.arrival_time=datetime.now()

    def get_wait_time_minutes(self):
        t=datetime.now()-self.arrival_time
        return t.total_seconds()//60


class ClinicManager:
    def __init__(self):
        self.resources=[]

        self.queues={
            ResourceType.DOCTOR:[],
            ResourceType.NURSE:[],
            ResourceType.XRAY:[]
        }

    def add_resource(self,resource): 
        self.resources.append(resource)

    def calculate_priority(self,patient):
        urgency_score=patient.urgency*10
        wait_score=patient.get_wait_time_minutes()
        return urgency_score + wait_score
    
    def get_priority_tuple(self,patient):
        priority=self.calculate_priority(patient)
        return (-priority,patient.id,patient)
    
    def add_patient(self, patient):
        queue= self.queues[patient.required_resource]
        priority_tuple=self.get_priority_tuple(patient)
        heapq.heappush(queue,priority_tuple)

    def refresh_priorities(self,resource_type):
        queue=self.queues[resource_type]
        if not queue:
            return 
        
        updated=[]
        for (old_priority, pid, patient) in queue:
            new_priority=self.calculate_priority(patient)
            updated.append((-new_priority,pid,patient))
        self.queues[resource_type]=updated
        heapq.heapify(updated)
    
    def get_next_patient(self,resource_type):

        self.refresh_priorities(resource_type)

        queue=self.queues[resource_type]

        if queue:
            priority, patient_id, patient=heapq.heappop(queue)
            return patient
        
        if resource_type == ResourceType.NURSE:
            doctor_queue = self.queues[ResourceType.DOCTOR]
            for i, (priority,pid,patient) in enumerate(doctor_queue):
                if patient.downgradeable:
                    doctor_queue.pop(i)
                    heapq.heapify(doctor_queue)

                    return patient
        return None
    
    def process_next(self,resource):
        patient=self.get_next_patient(resource.resource_type)

        if patient:
            resource.assign_patient(patient)
            return True
        else:
            return False
        

    def failure_handling(self):
        xray_queue=self.queues[ResourceType.XRAY]
        if not xray_queue:
            return 
        
        doctor_queue=self.queues[ResourceType.DOCTOR]

        for (priority,pid,patient) in xray_queue:
            patient.required_resource=ResourceType.DOCTOR
            new_priority_tuple=self.get_priority_tuple(patient)
            heapq.heappush(doctor_queue,new_priority_tuple)
        
        self.queues[ResourceType.XRAY]=[]


            
    ###############################################################
    def count_by_urgency(self,urgency_level)-> int:
        count=0
        for queue in self.queues.values():
            for (_,_,patient) in queue:
                if patient.urgency==urgency_level:
                    count+=1
        return count

    def is_patient_waiting(self,patient_id) -> bool:
        for queue in self.queues.values():
            for (_,pid,patient) in queue:
                if pid==patient_id:
                    return True
        return False
    
    def get_patient_positon(self,patient_id) -> int:
        resource_type=None
        
        for type,queue in self.queues.items():
            for (_,pid,patient) in queue:
                if pid==patient_id:
                    resource_type=type
                    break
        if resource_type is None:
            return None
        
        queue=self.queues[resource_type].copy()
        queue.sort(key=lambda x: x[0])

        for i,(_,pid,_) in enumerate(queue):
            if pid==patient_id:
                return i+1
        return None
            

    def release_all_resources(self):
        for resource in self.resources:
            if not resource.is_available:
                resource.release()
    
    def get_all_patients(self):

        return [patient for queue in self.queues.values() for (_,_,patient) in queue]
        
        # all_patients=[]
        # for queue in self.queues.values():
        #     for _,_,patient in queue:
        #         all_patients.append(patient)
        
        # return all_patients


    def get_patient_waiting_between(self,min_minutes,max_minutes):
        all_patients=self.get_all_patients()
        return [patient for patient in all_patients if min_minutes<= patient.get_wait_time_minutes()<=max_minutes]

    def copy_queue(self,from_resource,to_resource):
        self.queues[to_resource]=copy.deepcopy(self.queues[from_resource])

    def merge_queues(self,resource_type1,resource_type2,target_resource_type):
        if resource_type1==resource_type2:
            return
        self.queues[target_resource_type]=self.queues[resource_type1]+self.queues[resource_type2]
        heapq.heapify(self.queues[target_resource_type])

    def split_queue(self,resource_type,new_resource_type):
        if resource_type==new_resource_type:
            return
        
        queue1=self.queues[resource_type]
        queue2=self.queues[new_resource_type]
        size=len(queue1)
        i=0
        while i<size//2:
            heapq.heappush(queue2,heapq.heappop(queue1))
            i+=1
    
    def get_top_priority_patients(self,n):
        all_patients=self.get_all_patients()
        all_patients=sorted(all_patients,key=lambda x: self.calculate_priority(x),reverse=True)
        return all_patients[:n]
        




    # def failureHandling(self):
    #     xRayQ=self.queues[ResourceType.XRAY]
    #     doctorQ=self.queues[ResourceType.DOCTOR]

    #     for priority,pid,patient in xRayQ:
    #         patient.required_resource=ResourceType.DOCTOR
    #         new_patient_tuple=self.get_priority_tuple(patient)
    #         heapq.heappush(doctorQ, new_patient_tuple)
    #     self.queues[ResourceType.XRAY]=[]


    # def get_all_waiting_patients(self):
    #     merged= self.queues[ResourceType.DOCTOR]+ self.queues[ResourceType.NURSE]+self.queues[ResourceType.XRAY]
    #     all_patients=[]
    #     for (priority,pid,patient) in merged:
    #         pr=self.calculate_priority(patient)
    #         all_patients.append((pr,patient))
        
    #     all_patients.sort()

    #     return [patient for (priority,patient) in all_patients]
    
    # def find_patient_by_id(self, patient_id):
    #     for queue in self.queues.values():
    #         for (priority, pid,patient) in queue:
    #             if pid == patient_id:
    #                 return {
    #                     "patient": patient,
    #                     "resource": patient.required_resource,
    #                     "priority": -priority
    #                 }
    #     return None

    # def resources_patients_count(self):
    #     return
    #     {
    #         "Doctor":len(self.queues[ResourceType.DOCTOR]),
    #         "Nurse":len(self.queues[ResourceType.NURSE]),
    #         "XRay":len(self.queues[ResourceType.XRAY])
    #     }
    
    # def get_longest_waiting_patient(self):

    #     print(self.queues.values())
    #     print(self.queues.items())

    #     all_patients=[]

    #     for queue in self.queues.values():
    #         for (_,_,patient) in queue:
    #             all_patients.append(patient)

    #     if not all_patients:
    #         return None
        
    #     longest = max(all_patients,key=lambda patient: patient.get_wait_time_minutes())
    #     return longest
         
    # def remove_patient(self,patient_id):
    #     for queue in self.queues.values():
    #         for i, (_,pid,_) in enumerate(queue):
    #             if pid == patient_id:
    #                 queue.pop(i)
    #                 heapq.heapify(queue)
    #                 return True
    #     return False            

    # def update_urgency(self,patient_id,new_urgency):
    #     result = self.find_patient_by_id(patient_id)
    #     if not result:
    #         return False
        
    #     patient=result["patient"]
    #     resource=result["resource"]
    #     q=self.queues[resource]

    #     for i,(pr,pid,pt) in enumerate(q):
    #         if pid==patient_id:
    #             q.pop(i)
    #             heapq.heapify(q)
    #             break

    #     patient.urgency = new_urgency
    #     new_tuple = self.get_priority_tuple(patient)
    #     heapq.heappush(q,new_tuple)

    #     return True
    
    # def get_priority_list(self):
    #     all_patients=self.get_all_waiting_patients()
    #     priority_dict={}
    #     for patient in all_patients:
    #         urgency=patient.urgency
    #         priority_dict[urgency]= priority_dict.get(urgency,0)+1
    #     return priority_dict
    # def bussiest_queue(self):
    #     busiest=max(self.queues.items(),key=lambda x:len(x[1]))
    #     # resource,count= busiest
    #     return busiest

    # def get_stats(self):
    #     resource,count= self.bussiest_queue()
    #     return{
    #         "priority_list": self.get_priority_list(),
    #         "busiest_queue_is": (resource.name, len(count)) 
    #     }
        
    # def auto_assign_patients(self):

    #     for resource in self.resources:
    #         if resource.is_available:
    #             self.process_next(resource)





###################TESTING###################

if __name__ == "__main__":
    
    clinic = ClinicManager()
    
    doctor1 = Doctor(1, "Idan")
    doctor2 = Doctor(2, "Itai")
    nurse1 = Nurse(3, "Oren")
    xray1 = XRay(4)
    
    clinic.add_resource(doctor1)
    clinic.add_resource(doctor2)
    clinic.add_resource(nurse1)
    clinic.add_resource(xray1)
    
    
    clinic.add_patient(Patient("John", urgency=3, required_resource=ResourceType.DOCTOR))
    
    clinic.add_patient(Patient("Sarah", urgency=9, required_resource=ResourceType.DOCTOR))
    
    clinic.add_patient(Patient("Mike", urgency=5, required_resource=ResourceType.DOCTOR, downgradable=True))
    
    clinic.add_patient(Patient("Emma", urgency=2, required_resource=ResourceType.NURSE))
    
    clinic.add_patient(Patient("Bob", urgency=7, required_resource=ResourceType.XRAY))
    
    for resource_type, queue in clinic.queues.items():
        print(f"{resource_type.name} Queue: {len(queue)} patients")
        for priority, pid, patient in sorted(queue):
            print(f"  - {patient.name} (priority={-priority:.1f})")
    
    
    clinic.process_next(doctor1)
    
    clinic.process_next(nurse1)
    
    clinic.process_next(xray1)
    
    clinic.process_next(doctor2)
    
    for resource_type, queue in clinic.queues.items():
        print(f"{resource_type.name} Queue: {len(queue)} patients")
        for priority, pid, patient in sorted(queue):
            print(f"  - {patient.name} (priority={-priority:.1f})")
    
   
    
    
    time.sleep(3)
    
    clinic.add_patient(Patient("Lisa", urgency=4, required_resource=ResourceType.DOCTOR))
    
    clinic.refresh_priorities(resource_type=ResourceType.DOCTOR)
    doctor1.release()
    clinic.process_next(doctor1)
    
   
    print(f"- Total resources: {len(clinic.resources)}")
    print(f"- Patients in DOCTOR queue: {len(clinic.queues[ResourceType.DOCTOR])}")
    print(f"- Patients in NURSE queue: {len(clinic.queues[ResourceType.NURSE])}")
    print(f"- Patients in XRAY queue: {len(clinic.queues[ResourceType.XRAY])}")








    def handle_failure(self,resource_type):

        failed_queue=self.queues[resource_type]
        
        if not failed_queue:
            print(f"{resource_type} is failed but no patients waiting.")
            return
        
        doctor_queue=self.resources[ResourceType.DOCTOR]
        while failed_queue:
            priority,pid,patient=heapq.heappop(failed_queue)

            patient.required_resource=ResourceType.DOCTOR
            
            new_priority_tuple=self.get_priority_tuple(patient)

            heapq.heappush(doctor_queue,new_priority_tuple)